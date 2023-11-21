import {
    createBrowserRouter,
  } from "react-router-dom";
import Bookshelf from "../pages/Bookshelf";
import Reader from "../pages/Reader";
import Index from '../pages'
import PdfReader from "../pages/PdfReader";

export const router = createBrowserRouter([
    {
      path: '/',
      element: <Index></Index>,
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
          path: "/pef_reader/:book_id",
          element: <PdfReader></PdfReader>,
        },
      ]
    },
    
  ]);