import {
    createBrowserRouter,
  } from "react-router-dom";
import Bookshelf from "../pages/Bookshelf";
import Reader from "../pages/Reader";

export const router = createBrowserRouter([
    {
      path: "/",
      element: <Bookshelf></Bookshelf>,
    },
    {
      path: "/reader",
      element: <Reader></Reader>,
    },
  ]);