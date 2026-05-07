"use client"

import { Toaster as SonnerToaster } from "sonner"

import { useTheme } from "next-themes"

type ToasterProps = React.ComponentProps<typeof SonnerToaster>

function Toaster({ ...props }: ToasterProps) {
  const { theme = "system" } = useTheme()

  return (
    <SonnerToaster
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-gray-900 group-[.toaster]:border-gray-200 group-[.toaster]:shadow-lg dark:group-[.toaster]:bg-surface-dark dark:group-[.toaster]:text-gray-100 dark:group-[.toaster]:border-gray-700",
          description:
            "group-[.toast]:text-gray-500 dark:group-[.toast]:text-gray-400",
          actionButton:
            "group-[.toast]:bg-primary-600 group-[.toast]:text-primary-50 group-[.toast]:rounded-md",
          cancelButton:
            "group-[.toast]:bg-gray-100 group-[.toast]:text-gray-500 dark:group-[.toast]:bg-gray-800 dark:group-[.toast]:text-gray-400",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
