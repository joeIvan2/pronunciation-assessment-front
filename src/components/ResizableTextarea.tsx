import React, { forwardRef, useImperativeHandle } from "react";
import { useTextareaHeight } from "../hooks/useTextareaHeight";

interface ResizableTextareaProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onPaste?: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  fontSize?: number;
  className?: string;
  storageKey: string; // 存储高度的键名，使每个textarea实例可以有自己的高度记忆
  defaultHeight?: number;
}

/**
 * 可调整高度且会记忆高度的文本域组件
 */
export const ResizableTextarea = forwardRef<HTMLTextAreaElement, ResizableTextareaProps>(({
  value,
  onChange,
  onPaste,
  onBlur,
  placeholder,
  fontSize = 16,
  className = "",
  storageKey,
  defaultHeight = 140
}, ref) => {
  // 使用自定义hook管理textarea高度
  const { textareaRef, textareaProps } = useTextareaHeight(storageKey, defaultHeight);

  // 将内部ref暴露给外部
  useImperativeHandle(ref, () => textareaRef.current!);

  return (
    <textarea
      {...textareaProps} // 应用hook返回的props，包含ref和style
      value={value}
      onChange={onChange}
      onPaste={onPaste}
      onBlur={onBlur}
      className={className}
      style={{
        ...textareaProps.style,
        fontSize: `${fontSize}px`,
        resize: 'vertical' as const
      }}
      placeholder={placeholder}
    />
  );
});

export default ResizableTextarea; 