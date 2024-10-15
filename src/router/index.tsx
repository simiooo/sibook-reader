import {
  LazyRouteFunction,
  RouteObject,
  createBrowserRouter,
} from "react-router-dom";
import { Result } from "antd";
const Bookshelf = () => (import("../pages/Bookshelf"));
const Reader = () => import("../pages/Reader");
const Index = () => import('../pages');
const PdfReader = () => import("../pages/PdfReader");
const Login = () => import("../pages/Login");
const Island = () => import("../pages/Island");
const Register = () => import("../pages/Register");
const Profile = () => import("../pages/Profile");


export const router = createBrowserRouter([
  {
    path: '/',
    lazy: Index,
    
    children: [
      {
        path: "/",
        lazy: Bookshelf,
      },
      {
        path: "/login",
        lazy: Login,
      },
      {
        path: "/register",
        lazy: Register,
      },
      {
        path: "/reader/:book_id",
        lazy: Reader,
      },
      {
        path: "/pdf_reader/:book_id",
        lazy: PdfReader,
      },
      {
        path: '/island',
        lazy: Island,
      },
      {
        path: '/profile',
        lazy: Profile,
      }
    ]
  },

]);