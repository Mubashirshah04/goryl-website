'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import React from 'react'

type Props = {
	children: React.ReactNode
}

export function ThemeProvider({ children }: Props) {
	return (
		<NextThemesProvider attribute="class" defaultTheme="light" enableSystem={false}>
			{children}
		</NextThemesProvider>
	)
}


