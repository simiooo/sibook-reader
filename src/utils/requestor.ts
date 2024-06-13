import Axios from 'axios'
import { LoginType } from '../pages/Login'
export const requestor = Axios.create({
    baseURL: `${import.meta.env.VITE_API_URL}${import.meta.env.VITE_API_PREFIX}`,
    method: 'post',
    timeout: 30 * 1000,
})

requestor.interceptors.request.use(config => {
    const token = JSON.parse(localStorage.getItem('authorization') ?? "{}") as LoginType 
    config.headers['Authorization'] = `Bearer ${token.token}`
    return config
})

requestor.interceptors.response.use(config => {
    return config
})