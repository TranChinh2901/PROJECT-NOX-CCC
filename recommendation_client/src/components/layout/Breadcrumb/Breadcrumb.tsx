"use client"

import React from 'react'
import styles from './Breadcrumb.module.css'
import Link from 'next/link'

type Item = { label: string; href?: string }

export default function Breadcrumb({ items }: { items: Item[] }) {
  return (
    <nav aria-label="Breadcrumb" className={styles.root}>
      {items.map((it, idx) => {
        const isLast = idx === items.length - 1
        return (
          <span key={idx}>
            {isLast ? (
              <span className={styles.current}>{it.label}</span>
            ) : it.href ? (
              <Link href={it.href} className={styles.link}>{it.label}</Link>
            ) : (
              <span className={styles.link}>{it.label}</span>
            )}
            {!isLast && <span className={styles.separator}> /</span>}
          </span>
        )
      })}
    </nav>
  )
}