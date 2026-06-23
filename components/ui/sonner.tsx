import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
"use client"

import React from "react"
import { Toaster as Sonner, type ToasterProps } from "sonner"


const Toaster = ({ theme = "system", ...props }: ToasterProps) => {
  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <FontAwesomeIcon icon={faCheck}  className="size-4" />
        ),
        info: (
          <FontAwesomeIcon icon={faCheck}  className="size-4" />
        ),
        warning: (
          <FontAwesomeIcon icon={faCheck}  className="size-4" />
        ),
        error: (
          <FontAwesomeIcon icon={faCheck}  className="size-4" />
        ),
        loading: (
          <FontAwesomeIcon icon={faCheck}  className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
