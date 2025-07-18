import {
  Alert,
  Button,
  Col,
  Flex,
  Form,
  Input,
  Menu,
  message,
  Modal,
  Radio,
  Row,
  Select,
  Space,
  Spin,
  Tooltip,
} from "antd";
import { ReactElement, useEffect, useMemo, useRef, useState } from "react";
import { render } from "react-dom";
import styles from "./index.module.css";
import * as pdfjs from "pdfjs-dist";
import "pdfjs-dist/web/pdf_viewer.css";
import { VList, VListHandle } from "virtua";
import { useParams } from "react-router-dom";
import panzoomify, { PanZoom } from "panzoom";
import {
  useDebounceFn,
  useDrag,
  useLocalStorageState,
  useMap,
  useRequest,
  useSize,
  useThrottleFn,
} from "ahooks";
export const ANIMATION_STATIC = {
  whileTap: { scale: 0.75 },
  whileHover: { scale: 1.35 },
  transition: { type: "spring", stiffness: 400, damping: 17 },
};
export type OcrTask = Partial<{
  status: "error" | "done" | "loading" | "hidden";
  fragment: ReactElement;
  error: Error;
}>;
type ElementType<T> = T extends (infer U)[] ? U : T;
type OutlineType = ElementType<
  Awaited<ReturnType<pdfjs.PDFDocumentProxy["getOutline"]>>
>;

import { usePdfBook } from "./usePdfBook";
import { RenderTask } from "pdfjs-dist";
import { imageToTextByRemote } from "../../utils/imgToText";
import { readFileAsArrayBuffer } from "../../dbs/createBook";
import { CameraOutlined, ClearOutlined, EditOutlined } from "@ant-design/icons";
import { tesseractLuanguages } from "../../utils/tesseractLanguages";
import TranslatePortal from "../../components/TranslatePortal";
import { useReadingProgress } from "../../utils/useReadingProgress";
import { ItemType } from "antd/es/menu/interface";
import { useBookState } from "../../store";
import { COLOR_ENUM, COLOR_KEY } from "../../vars/color";
import { motion } from "framer-motion";
import { db } from "../../dbs/db";
import Page from "../../components/PDFComponents/Page";
import { PDFCacheProvider } from "../../components/PDFComponents/PDFCacheProvider";

const OVERSCAN = 4;
export const Component = function PdfReader() {
  const [book, pdfDocument, meta, loading, { book_id, contextHolder }] =
    usePdfBook();
  const [dividerLeft, setDividerLeft] = useState<number>(300);
  const zoomInstance = useRef<PanZoom>(null);
  const params = useParams();
  const [init, setInit] = useState<boolean>(false);
  const [pagination, setPagination] = useLocalStorageState<number>(
    `pagination:${book_id}`
  );
  const trashRef = useRef<HTMLDivElement>();
  const [brushConf, setbrushConf] = useState<string>();
  const brushColor = useMemo(() => {
    return Object.keys(COLOR_ENUM).includes(brushConf)
      ? (brushConf as any as COLOR_KEY)
      : (Object.keys(COLOR_ENUM)[0] as any as COLOR_KEY);
  }, [brushConf]);

  const [messageIns, messageContextHolder] = message.useMessage();
  // const editor = useCreateBlockNote();
  const [ocrTaskMap, { set, remove, reset }] = useMap<string, OcrTask>();
  const [selectedMenuKey, setSelectedMenuKey] = useState<string[]>();
  const [remoteProgress, setRemoteProgress] = useReadingProgress(book_id);
  const [isProgressInit, setIsProgressInit] = useState<boolean>(false);
  const { run: setRemoteProgressThrottle } = useThrottleFn(setRemoteProgress, {
    wait: 1000 * 5,
  });

  const profile = useBookState((state) => state.profile);

  const [isNewCommerTourOpen, setIsNewCommerTourOpen] =
    useLocalStorageState<boolean>(`userId:${profile}:bookId:${book_id}`, {
      defaultValue: true,
    });

  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [ocrSelectOpen, setOcrSelectOpen] = useState(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const [modalHook, progressHolder] = Modal.useModal();

  const cachePageImageMap = useRef<Map<number, OffscreenCanvas>>(new Map());

  const destroy = () => {
    cachePageImageMap.current.clear();
    setSelectedMenuKey([]);
    reset();
    setInit(false);
  };

  useEffect(() => {
    destroy();
  }, [book_id]);

  const dividerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const VlistRef = useRef<VListHandle>(null);

  const [canvasScale, setCanvasScale] = useState(1);
  // const { handlePointerDown, handlePointerMove, linesMap, get: LinesGet, remove: linesRemove } = useAnnotation(book_id, canvasScale)
  const panzoomifyFactory = () =>
    panzoomify(listRef.current, {
      beforeWheel: function (e) {
        const shouldIgnore = !(e.ctrlKey || e.metaKey);
        return shouldIgnore;
      },
      onDoubleClick() {
        return false;
      },
      beforeMouseDown: function (e) {
        const shouldIgnore = !(e.ctrlKey || e.metaKey);
        return shouldIgnore;
      },
      zoomDoubleClickSpeed: 1,
    });
  useEffect(() => {
    listRef.current.style.setProperty("--scale-factor", String(1));
  }, [canvasScale]);

  const { run: canvasScaleHandler } = useDebounceFn(
    (e) => {
      const scale = e?.getTransform?.()?.scale;
      setIsRendering(true);
      setCanvasScale(scale ?? 1);
    },
    {
      wait: 200,
    }
  );

  const getCacheOcrFragment = (index: number, cache: OcrTask) => {
    const ocrContaienr = document.querySelector(
      `[data-ocrpageindex="${index}"]`
    );
    if (ocrContaienr.innerHTML.length > 0) {
      return;
    }
    render(cache?.fragment, ocrContaienr);
    return;
  };

  // ocr 文字识别层
  const ocrTextLayerBuilder = async (
    canvas: HTMLCanvasElement,
    index: number
  ) => {
    const text = canvas.toDataURL("image/png");
    const _res = (await imageToTextByRemote(encodeURIComponent(text.slice(22))))
      ?.data?.data;
    const containeDom = document.querySelector<HTMLDivElement>(
      `[data-ocrpageindex="${index}"]`
    );
    if (_res?.words_result instanceof Array) {
      const rcnode = (
        <div
          style={{
            width: "100%",
            height: "100%",
            position: "relative",
          }}
        >
          {_res.words_result.map((el, index) => (
            <>
              <span
                key={index}
                style={{
                  position: "absolute",
                  color: "transparent",
                  left:
                    el?.location?.left / canvasScale / window.devicePixelRatio,
                  top:
                    el?.location?.top / canvasScale / window.devicePixelRatio,
                  fontSize:
                    el?.location?.height /
                    canvasScale /
                    window.devicePixelRatio,
                }}
              >
                {el?.words + " "}
              </span>
            </>
          ))}
        </div>
      );
      render(rcnode, containeDom);
      const languagesSetting = JSON.stringify(form.getFieldValue("ocr") ?? []);
      set(index + languagesSetting, { status: "done", fragment: rcnode });
    }
    return;
  };

  useEffect(() => {
    if (!zoomInstance) {
      return;
    }
    zoomInstance.current = panzoomifyFactory();
    zoomInstance.current.on("zoom", canvasScaleHandler);
    return () => {
      zoomInstance.current.dispose();
    };
  }, []);

  useDrag(undefined, dividerRef, {
    onDragEnd(event) {
      setDividerLeft(event.clientX);
    },
  });

  // 避免pdfjs重复调用render方法
  const pageRenderTask = useRef<
    Map<CanvasRenderingContext2D, { renderTask: RenderTask }>
  >(new Map());
  useEffect(() => {
    pageRenderTask.current.clear();
  }, [params]);
  const [form] = Form.useForm();

  // 生成 pdf 页对象 引用
  const { data: pages } = useRequest(
    async () => {
      if (!meta?.numPages) return;
      const pages = (
        await Promise.allSettled(
          new Array(meta.numPages)
            .fill(0)
            .map((el, index) => pdfDocument.getPage(index + 1))
        )
      ).map((el) => ("value" in el ? el.value : undefined));
      return pages;
    },
    {
      refreshDeps: [meta?.numPages],
    }
  );

  const { data: maxWidthViewPort } = useRequest(
    async () => {
      return (pages ?? []).reduce((pre, page) => {
        const viewport = page.getViewport();
        return Math.max(
          pre,
          viewport.viewBox[2] ??
            (Number.isNaN(viewport.width) ? 700 : viewport.width)
        );
      }, 0);
    },
    {
      refreshDeps: [pages],
    }
  );

  // 初始化页码
  useEffect(() => {
    if (!init && pages?.length > 0) {
      form.setFieldValue(["page"], pagination ?? 0);
      VlistRef.current.scrollToIndex((pagination ?? 0) - 1);
      setInit(true);
    }

    if (!init) {
      return;
    }
    if (
      isProgressInit ||
      !(Number(remoteProgress) > 0) ||
      Math.abs(Number(remoteProgress) - Number(pagination)) < 2
    ) {
      return;
    }
    if (remoteProgress === -1) {
      return;
    }
    modalHook.confirm({
      title: "云端同步",
      content: `远端已有阅读进度，是否使用云端进度第 ${remoteProgress} 页`,
      onOk() {
        form.setFieldValue("page", remoteProgress);
        VlistRef.current.scrollToIndex(remoteProgress ?? 1);
      },
    });
    setIsProgressInit(true);
  }, [pages, remoteProgress]);

  const size = useSize(listRef);

  return (
    <PDFCacheProvider>
      <Spin
        spinning={Object?.values(loading ?? {})?.some?.((loading) => loading)}
      >
        <div key={1}>{progressHolder}</div>
        <div key={2}>{messageContextHolder}</div>
        {contextHolder}
        <div className={styles.container}>
          <Row wrap={false}>
            <Col flex={`0 1 ${dividerLeft}px`}>
              <div className={styles.menuContainer}>
                <Menu
                  items={pdfToMenuItemHandler(meta?.outline as any)}
                  onSelect={async (v) => {
                    const keyInfo = JSON.parse(v.key);
                    if (keyInfo?.value && keyInfo?.value instanceof Object) {
                      const key = keyInfo.value;
                      const destRef = key;
                      const pageRef = destRef.find((el) => el?.num);
                      const page = pages.find(
                        (el) =>
                          JSON.stringify(el.ref) ===
                          JSON.stringify(pageRef ?? "{}")
                      );
                      form.setFieldValue(["page"], page.pageNumber);
                      VlistRef.current.scrollToIndex(page.pageNumber - 1);
                    } else if (
                      keyInfo?.value &&
                      typeof keyInfo.value === "string"
                    ) {
                      const des = await pdfDocument.getDestination(
                        keyInfo?.value
                      );
                      const pageNumber = await pdfDocument.getPageIndex(
                        des?.[0]
                      );
                      form.setFieldValue(["page"], pageNumber);
                      VlistRef.current.scrollToIndex(pageNumber - 1);
                    }
                    setSelectedMenuKey(v.keyPath ?? []);
                  }}
                  selectedKeys={selectedMenuKey}
                ></Menu>
              </div>
            </Col>
            <Col flex={"0 1"}>
              <div ref={dividerRef} className={styles.viewDrag}></div>
            </Col>
            <Col flex={"1 0"}>
              <div className={styles.reader}>
                <div className={styles.tips}>
                  <Space direction="vertical">
                    <Space>
                      <Tooltip
                        placement="rightBottom"
                        title={`是否编辑(当前状态：${isEditing ? "是" : "否"})`}
                      >
                        <Button
                          type={isEditing ? "primary" : "default"}
                          icon={<EditOutlined />}
                          // type={'primary'}
                          onClick={() => {
                            setIsEditing(!isEditing);
                            if (!isEditing) {
                              messageIns.success(
                                "在 pdf 文档上 长按鼠标左键后拖动 进行标记"
                              );
                            }
                          }}
                        ></Button>
                      </Tooltip>
                      {isEditing ? (
                        <motion.div
                          initial={{
                            opacity: 0,

                            scale: 0.9,
                          }}
                          animate={{
                            opacity: 1,
                            scale: 0.9,
                          }}
                          transition={{
                            originX: 0,
                            originY: 0,
                          }}
                        >
                          <Radio.Group
                            defaultValue={Object.keys(COLOR_ENUM)[0]}
                            // size="large"
                            // buttonStyle="solid"
                            value={brushConf}
                            onChange={(v) => {
                              setbrushConf(v?.target?.value);
                            }}
                          >
                            {Object.entries(COLOR_ENUM).map((el) => {
                              const [key, value] = el;
                              return (
                                <Radio.Button key={key} value={key}>
                                  <Flex
                                    align="center"
                                    style={{
                                      height: "100%",
                                    }}
                                  >
                                    <div
                                      style={{
                                        width: "1rem",
                                        height: "1rem",
                                        borderRadius: ".5rem",
                                        background: `#${value["900"]}`,
                                      }}
                                    ></div>
                                  </Flex>
                                </Radio.Button>
                              );
                            })}
                            <Radio.Button value={"eraser"}>
                              <Flex
                                align="center"
                                style={{
                                  height: "100%",
                                }}
                              >
                                <div
                                  style={{
                                    width: "1rem",
                                    height: "1.55rem",
                                  }}
                                >
                                  <ClearOutlined />
                                </div>
                              </Flex>
                            </Radio.Button>
                          </Radio.Group>
                        </motion.div>
                      ) : undefined}
                    </Space>
                    {isNewCommerTourOpen ? (
                      <>
                        <Alert
                          closable
                          type="warning"
                          onClose={() => {
                            setIsNewCommerTourOpen(false);
                          }}
                          message={"按住 Ctrl 时，滑动鼠标滚轮可缩放文档"}
                        ></Alert>
                        <Alert
                          closable
                          type="warning"
                          onClose={() => {
                            setIsNewCommerTourOpen(false);
                          }}
                          message={"按住 Ctrl 时，鼠标左键可拖动文档位置"}
                        ></Alert>
                      </>
                    ) : null}
                  </Space>
                </div>
                <div
                  className={styles.reader_tooltip}
                  style={{
                    right: !ocrSelectOpen ? "3.6rem" : "13.85rem",
                  }}
                >
                  <div className={styles.page}>
                    {/* 阅读器控制区 */}
                    <Form
                      form={form}
                      initialValues={{
                        page: 1,
                        ocr: ["chi_sim", "jpn", "eng"],
                      }}
                      onValuesChange={(v) => {
                        if (v?.page && init) {
                          VlistRef.current.scrollToIndex(v.page);
                        }
                      }}
                    >
                      <Space align="start">
                        <Form.Item
                          name="page"
                          normalize={(v?: string) => {
                            const text = v?.replaceAll(/[^\d]/g, "") || "1";
                            return Math.max(
                              1,
                              Math.min(meta.numPages as number, Number(text))
                            );
                          }}
                        >
                          <Input
                            style={{
                              minWidth: "6rem",
                            }}
                            suffix={
                              <span>/ {(meta?.numPages ?? 0) as number}</span>
                            }
                          ></Input>
                        </Form.Item>
                        <Tooltip title={"更改 OCR 语言"} placement="bottom">
                          {ocrSelectOpen ? (
                            <Space align="start">
                              <Form.Item name={"ocr"}>
                                <Select
                                  style={{ minWidth: "9rem" }}
                                  options={tesseractLuanguages.map((el) => ({
                                    label: el.Language,
                                    value: el["Lang Code"],
                                  }))}
                                  // maxTagCount={2}
                                  mode="multiple"
                                  showSearch
                                  filterOption={(value, option) => {
                                    return (
                                      JSON.stringify(option ?? {}).indexOf(
                                        value
                                      ) > -1
                                    );
                                  }}
                                ></Select>
                              </Form.Item>
                              <Button
                                type="primary"
                                onClick={() => {
                                  setOcrSelectOpen(false);
                                }}
                                icon={<CameraOutlined />}
                              ></Button>
                            </Space>
                          ) : (
                            <div>
                              <Form.Item hidden name={"ocr"}>
                                <input type="text" />
                              </Form.Item>
                              <Button
                                onClick={() => {
                                  setOcrSelectOpen(true);
                                }}
                                icon={<CameraOutlined />}
                              ></Button>
                            </div>
                          )}
                        </Tooltip>
                      </Space>
                    </Form>
                  </div>
                </div>

                <div
                  ref={listRef}
                  style={{
                    height: "100%",
                    width: `${maxWidthViewPort + 186}px`,
                  }}
                >
                  <VList
                    ref={VlistRef}
                    count={pages?.length ?? 0}
                    style={{
                      height: "100%",
                      width: `100%`,
                    }}
                    overscan={OVERSCAN}
                    onRangeChange={(startIndex, endIndex) => {
                        form.setFieldValue(["page"], startIndex ?? 0);
                    }}
                  >
                    {(pages ?? []).map((page, index) => {
                      return (
                        <Page
                          page={page}
                          languagesSetting={[]}
                          pageIndex={index}
                          canvasScale={canvasScale}
                          brushColor={brushColor}
                          isEditing={isEditing}
                          brushConf={brushConf}
                          size={size}
                          bookId={book_id}
                        ></Page>
                      );
                    })}
                  </VList>
                </div>
              </div>
            </Col>
          </Row>
        </div>
        <TranslatePortal></TranslatePortal>
        <div
          ref={trashRef}
          style={{
            position: "absolute",
            top: 0,
            transform: `translateY(-100%)`,
          }}
          className="trash"
        ></div>
      </Spin>
    </PDFCacheProvider>
  );
};

const pdfToMenuItemHandler = (item?: OutlineType[]): ItemType[] => {
  return item?.map((el) => {
    return {
      label: el.title,
      origininfo: el,
      key: JSON.stringify({
        title: el?.title,
        value: el?.dest ?? [],
      }),
      children:
        el.items?.length > 0 ? pdfToMenuItemHandler(el.items) : undefined,
    };
  });
};
export function traversalDom(
  dom?: Element | HTMLElement | DocumentFragment,
  cb?: (item: Element | HTMLElement | DocumentFragment) => void
) {
  if (!dom) {
    return;
  }
  cb?.(dom);
  for (const el of dom?.children ?? []) {
    cb?.(el);
    traversalDom(el, cb);
  }
}

export function getSvgPathFromStroke(stroke) {
  if (!stroke.length) return "";

  const d = (stroke ?? []).reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ["M", ...stroke[0], "Q"]
  );

  d.push("Z");
  return d.join(" ");
}
