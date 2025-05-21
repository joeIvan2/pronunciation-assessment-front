import { useRef, useEffect, useState } from 'react';

/**
 * 自定义hook: 管理textarea高度并保存到localStorage
 * @param storageKey 存储高度的localStorage键名
 * @param defaultHeight 默认高度（像素）
 * @returns 包含textarea高度相关的状态和props
 */
export const useTextareaHeight = (storageKey: string, defaultHeight: number = 140) => {
  // 从localStorage获取保存的高度或使用默认值
  const getInitialHeight = (): number => {
    const saved = localStorage.getItem(storageKey);
    return saved ? parseInt(saved, 10) : defaultHeight;
  };

  // 当前高度状态
  const [height, setHeight] = useState<number>(getInitialHeight);
  // textarea引用
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 保存高度到localStorage
  const saveHeight = (newHeight: number) => {
    if (newHeight > 0 && newHeight !== height) {
      setHeight(newHeight);
      localStorage.setItem(storageKey, newHeight.toString());
    }
  };

  // 监听textarea调整大小
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // 设置初始高度
    textarea.style.height = `${height}px`;
    
    // 检测高度变化
    let initialHeight = textarea.clientHeight;
    
    const checkResize = () => {
      const currentHeight = textarea.clientHeight;
      if (currentHeight !== initialHeight && currentHeight > 0) {
        initialHeight = currentHeight;
        saveHeight(currentHeight);
      }
    };
    
    // 监听鼠标释放事件，捕获拖拽调整后的高度
    const handleMouseUp = () => {
      // 使用多个时间点检查，确保能捕获到高度变化
      setTimeout(checkResize, 0);
      setTimeout(checkResize, 100);
      setTimeout(checkResize, 300);
    };
    
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [height, storageKey]);

  // 返回必要的props和状态
  return {
    textareaRef,
    height,
    textareaProps: {
      ref: textareaRef,
      style: {
        height: `${height}px`,
        resize: 'vertical'
      }
    }
  };
}; 