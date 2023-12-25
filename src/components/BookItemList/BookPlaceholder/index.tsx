import { Card } from 'antd'
import React from 'react'
import style from './index.module.css'

export default function BookPlaceholder() {
  return (
    <Card
    className={[
      'book_item',
      style.placeholder,
    ].join(' ')}
    ></Card>
  )
}
