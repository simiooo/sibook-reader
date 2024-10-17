import {
  LazyRouteFunction,
  RouteObject,
  createBrowserRouter,
} from "react-router-dom";
import { Button, Col, Result, Row } from "antd";
const Bookshelf = () => (import("../pages/Bookshelf"));
const Reader = () => import("../pages/Reader");
const Index = () => import('../pages');
const PdfReader = () => import("../pages/PdfReader");
const Login = () => import("../pages/Login");
const Island = () => import("../pages/Island");
const Register = () => import("../pages/Register");
const Profile = () => import("../pages/Profile");
const IslandJoin = () => import("../pages/IslandJoin");

export const router = createBrowserRouter([
  {
    path: '/',
    lazy: Index,
    errorElement: <Result status='error'>
      <Row 
      gutter={[24, 24]}
      justify={'center'}
      align={'middle'}
      >
        <Col>
        <span>404 Page Not Found</span>
        </Col>
        <Col>
        <Button
        type="link"
        href="/"
        >Go back</Button>
        </Col>
      </Row>
      </Result>,
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
      },
      {
        path: '/islandJoin',
        lazy: IslandJoin
      }
    ]
  },

]);