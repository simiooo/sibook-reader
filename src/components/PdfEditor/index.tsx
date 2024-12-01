import React, { useCallback, useEffect, useRef, useState } from 'react'
import { COLOR_ENUM } from '../../vars/color';
import { useBookState } from '../../store';
import { useInterval, useThrottleFn } from 'ahooks';
import type Fabric from 'fabric'
export type PdfEditorProps = {
    editable?: boolean;
    color: keyof typeof COLOR_ENUM;
    width: number;
    isEraserEnable?: boolean;
    id: string;
    style?: React.CSSProperties;
}

export default function PdfEditor(props: PdfEditorProps) {
    const [_fabric, setFabric] = useState<Fabric.Canvas>()
    const canvasRef = useRef<HTMLCanvasElement>()
    const db_instance = useBookState(state => state.db_instance)
    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = new fabric.Canvas(canvasRef.current, {
            isDrawingMode: true,
        })
        setFabric(canvas)
        canvas.on('path:created', (e) => {
            // console.log(e)
            serialize()
        })
        return () => {
            canvas.dispose()
        }
    }, [])

    useEffect(() => {
        
        drawbrushInit()

    }, [props.editable, props.color, props.width, _fabric]);

    const drawbrushInit = useCallback(() => {
        if (!_fabric) return;
        if (!props?.editable) {
            return
        }
        _fabric.freeDrawingBrush = new fabric.PencilBrush(_fabric)
        _fabric.isDrawingMode = !!props.editable;
        _fabric.freeDrawingBrush.color = `#${COLOR_ENUM[props.color][900]}b0`;
        _fabric.freeDrawingBrush.width = props.width;
    }, [props.editable, _fabric, props.color, props.width])

    useEffect(() => {
        if (!db_instance) {
            return
        }
        if (!props?.id) {
            return
        }
        if (!_fabric) {
            return
        }
        db_instance.pdf_notes.get(props.id)
            .then(data => {
                if (!data.content) {
                    return
                }
                _fabric.loadFromJSON(data.content)
            })
    }, [db_instance, props.id, _fabric])

    useEffect(() => {
        if (!_fabric) return;
        if (!props.style) {
            return
        }
        const width = props.style?.width || 800;
        const height = props.style?.height || 600;
        _fabric.setWidth(Number(width))
        _fabric.setHeight(Number(height))
        _fabric.renderAll()
    }, [props.style, _fabric]);

    const { run: serialize } = useThrottleFn(() => {

        db_instance.pdf_notes.get(props?.id)
            .then(data => {
                if (!data) {
                    db_instance.pdf_notes.add({
                        id: props.id,
                        content: JSON.stringify(_fabric)
                    })
                } else {
                    db_instance.pdf_notes.update(data, {
                        content: JSON.stringify(_fabric)
                    })
                }
            })
    }, {
        wait: 500
    })




    useEffect(() => {
        if(!_fabric) {
            return
        }
        if(props?.isEraserEnable) {
            _fabric.freeDrawingBrush = new (fabric as any).EraserBrush(_fabric);
            _fabric.freeDrawingBrush.width = props.width * 2;
        } else {
            drawbrushInit()
        }
    }, [props?.isEraserEnable])
    return (
        <canvas
            style={props.style}
            ref={canvasRef}
        ></canvas>
    )
}
