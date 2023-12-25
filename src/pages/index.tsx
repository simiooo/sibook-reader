import { Flex, Layout } from 'antd'
import { Content, Footer, Header } from 'antd/es/layout/layout'
import { Outlet } from 'react-router-dom'
import BookTabs from '../components/BookTabs'

export default function index() {

    return (
        <div>
            <Flex >
                <BookTabs></BookTabs>
            </Flex>
            <Outlet></Outlet>

        </div>

    )
}
