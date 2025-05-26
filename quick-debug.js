// 快速檢測水平滾動問題 - 直接複製到瀏覽器控制台使用
(function() {
  const viewportWidth = window.innerWidth;
  const culprits = [];
  
  // 檢查所有元素
  document.querySelectorAll('*').forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.right > viewportWidth || rect.width > viewportWidth) {
      culprits.push({
        element: el,
        tag: el.tagName,
        class: el.className,
        id: el.id,
        width: Math.round(rect.width),
        overflow: Math.round(rect.right - viewportWidth)
      });
      // 標記問題元素
      el.style.outline = '2px solid red';
      el.style.backgroundColor = 'rgba(255,0,0,0.1)';
    }
  });
  
  // 排序並輸出
  culprits.sort((a, b) => b.overflow - a.overflow);
  
  console.log(`🚨 發現 ${culprits.length} 個導致水平滾動的元素:`);
  culprits.forEach((item, i) => {
    const selector = `${item.tag}${item.id ? '#' + item.id : ''}${item.class ? '.' + item.class.split(' ').join('.') : ''}`;
    console.log(`${i + 1}. ${selector} - 寬度: ${item.width}px, 超出: ${item.overflow}px`);
  });
  
  console.log(`\n頁面總寬度: ${document.body.scrollWidth}px, 視窗寬度: ${viewportWidth}px`);
  console.log('問題元素已用紅色邊框標記');
  console.log('執行 clearHighlights() 清除標記');
  
  // 提供清除函數
  window.clearHighlights = () => {
    document.querySelectorAll('*').forEach(el => {
      el.style.outline = '';
      el.style.backgroundColor = '';
    });
    console.log('✅ 已清除高亮標記');
  };
  
  return culprits;
})(); 