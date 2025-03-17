import { CloseOutlined, FontColorsOutlined } from "@ant-design/icons";
import { Button, Space, Tooltip } from "antd";
import { PDFPageProxy } from "pdfjs-dist";
import * as pdfjs from "pdfjs-dist";
import React, { useEffect, useRef, useState } from "react";
type Size = {
  width: number;
  height: number;
};
export interface PageProps {
  page: PDFPageProxy;
  languagesSetting: string[];
  pageIndex: number;
  canvasScale: number;
  brushColor: COLOR_KEY;
  isEditing: boolean;
  brushConf: string;
  size: Size;
  bookId: string;
}
import styles from "./index.module.css";
import { render } from "react-dom";
import PdfEditor from "../../PdfEditor";
import { COLOR_KEY } from "../../../vars/color";
import { useRequest, useThrottleFn } from "ahooks";
import { OcrTask } from "../../../pages/PdfReader";
import { imageToTextByRemote } from "../../../utils/imgToText";
import { useBookState } from "../../../store";
export default function Page(props: PageProps) {
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [ocrCache, setOcrCache] = useState<OcrTask>({ status: "hidden" });
  const canvasRef = useRef<HTMLCanvasElement>();
  const canvasSubRef = useRef<HTMLCanvasElement>();
  // const db = useBookState((state) => state.db_instance);
  const isDprSet = useRef<boolean>(false);
  const textLayerRef = useRef<HTMLDivElement>();
  const [canvasCache, setCanvasCache] = useState<OffscreenCanvas>();
  useEffect(() => {
    // db.pdf_page_image_cache
    //   .get({ id: `${props?.bookId}/${props?.pageIndex}` })
    //   .then(async (res) => {
    //     const data = await createImageBitmap(res.blob)
    //     const offscreenCanvas = new OffscreenCanvas(
    //       props?.size?.width,
    //       props?.size?.height
    //     );
    //     const offCtx = offscreenCanvas.getContext("2d");
    //     offCtx.drawImage(
    //       data,
    //       0,
    //       0,
    //       props?.size?.width,
    //       props?.size?.height
    //     );
    //     setCanvasCache(offscreenCanvas);
    //   })
    //   .catch((err) => {});
  }, []);
  const viewport = props?.page.getViewport({
    scale: 1,
  });
  const languagesSetting = props?.languagesSetting;
  const dpr = window.devicePixelRatio || 1;

  // ocr 文字识别层
  const ocrTextLayerBuilder = async (canvas: HTMLCanvasElement) => {
    const text = canvas.toDataURL("image/png");
    const _res = (await imageToTextByRemote(encodeURIComponent(text.slice(22))))
      ?.data?.data;
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
                    el?.location?.left /
                    props?.canvasScale /
                    window.devicePixelRatio,
                  top:
                    el?.location?.top /
                    props?.canvasScale /
                    window.devicePixelRatio,
                  fontSize:
                    el?.location?.height /
                    props?.canvasScale /
                    window.devicePixelRatio,
                }}
              >
                {el?.words + " "}
              </span>
            </>
          ))}
        </div>
      );
      return rcnode;
    }
    return;
  };

  const [pdfJsrenderTask, setPdfJsrenderTask] = useState<{
    renderTask: pdfjs.RenderTask;
  }>();

  // pdf 渲染处理
  const { run: pdfPageRenderHandler } = useThrottleFn(
    async (page: pdfjs.PDFPageProxy) => {
      const renderTaskQueue = [];
      setIsRendering(true);
      const dpr = window.devicePixelRatio || 1; // css 像素与物理像素比
      const canvas = canvasRef.current;
      const canvasSub = canvasSubRef.current;
      const textLayer = textLayerRef.current;
      const ctx = canvas?.getContext("2d");
      const subCtx = canvasSub?.getContext("2d");
      if (!ctx) {
        setIsRendering(false);
        return;
      }

      // 取消相同引用未完成的渲染任务
      if (pdfJsrenderTask?.renderTask) {
        pdfJsrenderTask?.renderTask?.cancel?.();
      }
      if (canvasCache) {
        subCtx.drawImage(canvasCache, 0, 0, canvasSub.width, canvasSub.height);
      }
      ctx.reset();
      ctx.scale(dpr, dpr); // 不能让dpr去缩放canvas多次,但又必须在恰当的时机重新缩放
      const viewport = page.getViewport({
        scale: props?.canvasScale,
      });
      const textViewport = page.getViewport({ scale: 1 });
      const task = page.render({
        viewport,
        canvasContext: ctx,
      });
      const promiseTask = task.promise;
      renderTaskQueue.push(
        promiseTask
          .then(() => {
            if (!canvasCache) {
              canvas.toBlob(
                async (data) => {
                  // db.pdf_page_image_cache.put(
                  //   { id: `${props?.bookId}/${props?.pageIndex}`, blob: data },
                  //   `${props?.bookId}/${props?.pageIndex}`
                  // );
                },
                "image/png",
                1
              );
            }
          })
          .finally(() => {})
      );

      pdfjs.renderTextLayer({
        textContentSource: page.streamTextContent(),
        viewport: textViewport,
        container: textLayer,
      });
      promiseTask.catch((err) => {
        // 屏蔽这个异常，因为这个异常是故意的
        if (err instanceof pdfjs.RenderingCancelledException) {
          return;
        }
        console.error(err);
      });

      // 避免潜在的竞态情况
      setPdfJsrenderTask({ renderTask: task });

      Promise.allSettled(renderTaskQueue).finally(() => {
        setIsRendering(false);
      });
    },
    {
      wait: 200,
      leading: true,
    }
  );

  useRequest(
    async () => {
      if (!props.canvasScale) {
        return;
      }
      if (!props.page) {
        return;
      }
      pdfPageRenderHandler(props.page);
    },
    {
      refreshDeps: [
        // props.bookId,
        props.canvasScale,
        props.page,
        // props.size,
        // props.pageIndex
      ],
    }
  );

  return (
    <div
      className={styles.pageContainer}
      key={props?.pageIndex}
      style={{
        position: "relative",
      }}
    >
      <div className={styles.pageDivider}></div>
      <canvas
        className={styles.canvasContainer}
        width={viewport.width * props?.canvasScale * dpr}
        data-pageindex={props?.pageIndex}
        height={viewport.height * props?.canvasScale * dpr}
        style={{
          height: viewport?.height ?? 1000,
          width: viewport?.width,
          background: "white",
        }}
        ref={canvasRef}
      ></canvas>
      <canvas
        className={styles.canvasSubContainer}
        width={viewport.width}
        height={viewport.height}
        ref={canvasSubRef}
        data-pageindex={props?.pageIndex}
        style={{
          height: viewport.height,
          width: viewport.width,
          background: "transparent",
          position: "absolute",
          left: ((props?.size?.width ?? 0) - viewport.width) / 2 - 4,
          top: 12,
          opacity: isRendering ? 1 : 0,
        }}
      ></canvas>
      <div
        ref={textLayerRef}
        data-pageindex={props?.pageIndex}
        className={`textLayer ${styles.textLayerContainer}`}
        style={{
          position: "absolute",
          left: ((props?.size?.width ?? 0) - viewport.width) / 2 - 4,
          top: 12,
        }}
      ></div>

      {/* <div
        className={styles.ocrLayer}
        data-ocrpageindex={props?.pageIndex}
        style={{
          position: "absolute",
          left: ((props?.size?.width ?? 0) - viewport.width) / 2 - 4,
          top: 12,
          zIndex: 2,
          height: viewport.height,
          width: viewport.width,
          display: props?.ocrCache?.status !== "done" ? "none" : "block",
        }}
      >
        {props?.ocrCache?.fragment}
      </div> */}
      <div
        data-pageindex={props?.pageIndex}
        className={`annotationCusTom ${styles.annotationCusTom}`}
        style={{
          zIndex: 3,
          height: viewport.height,
          width: viewport.width,
          position: "absolute",
          left: ((props?.size?.width ?? 0) - viewport.width) / 2 - 4,
          top: 12,
          pointerEvents: props?.isEditing ? undefined : "none",
        }}
      >
        <PdfEditor
          id={`${props?.bookId}/${props?.pageIndex}`}
          color={props?.brushColor}
          width={10}
          editable={true}
          isEraserEnable={props?.brushConf === "eraser"}
          style={{
            width: viewport.width,
            height: viewport.height,
          }}
        ></PdfEditor>
      </div>
      <div
        className={styles.toolbar}
        style={{
          position: "absolute",
          overflow: "visible",
          left: ((props?.size?.width ?? 0) - viewport.width) / 2 - 4,
          top: 12 / window.devicePixelRatio,
          zIndex: 2,
          transform: "translateX(calc(-100% - 0.25rem))",
        }}
      >
        <Space direction="vertical">
          <Tooltip title={"提取图片文字"}>
            {/* {ocrTaskMap.get(props?.pageIndex + languagesSetting)?.status !==
            "done" ? (
              <Button
                type="primary"
                size="small"
                loading={false
                }
                icon={<FontColorsOutlined />}
                onClick={() => {
                  
                }}
              ></Button>
            ) : (
              <Button
                type="primary"
                size="small"
                icon={<CloseOutlined />}
                onClick={() => {
                 
                }}
              ></Button>
            )} */}
          </Tooltip>
          {/* <Tooltip
          title="删除笔记"
        >
          <Popconfirm
            title="确定删除吗"
            okType='danger'
            okButtonProps={{
              disabled: !isEditing
            }}
            onConfirm={() => {
              linesRemove(String(index))
            }}
          >
            <Button
              type="primary"
              danger
              disabled={!isEditing}
              icon={<DeleteOutlined />}
              size='small'
            ></Button>
          </Popconfirm>

        </Tooltip> */}
        </Space>
      </div>
    </div>
  );
}
