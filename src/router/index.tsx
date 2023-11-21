import {
  createBrowserRouter,
} from "react-router-dom";
import Bookshelf from "../pages/Bookshelf";
import Reader from "../pages/Reader";
import Index from '../pages'
import PdfReader from "../pages/PdfReader";
import { Result } from "antd";

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Index></Index>,
    errorElement: <div
    style={{
      display: 'flex',
      height:'90vh',
      width:'100vw',
      justifyContent: 'center',
      alignItems: 'center',
    }}
    >
      <Result
        status={'error'}
        title="错误，请联系开发者"
      ></Result>
    </div>,
    children: [
      {
        path: "/",
        element: <Bookshelf></Bookshelf>,
      },
      {
        path: "/reader/:book_id",
        element: <Reader></Reader>,
      },
      {
        path: "/pdf_reader/:book_id",
        element: <PdfReader></PdfReader>,
      },
    ]
  },

]);