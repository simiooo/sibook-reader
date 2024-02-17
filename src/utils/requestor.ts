import Axios from 'axios'
import { LoginType } from '../pages/Login'
console.log(import.meta.env.VITE_API_URL)
export const requestor = Axios.create({
    baseURL: `${import.meta.env.VITE_API_URL}/api`,
    method: 'post',
})

requestor.interceptors.request.use(config => {
    const token = JSON.parse(localStorage.getItem('authorization') ?? "{}") as LoginType 
    config.headers['Authorization'] = `Bearer ${token.token}`
    return config
})