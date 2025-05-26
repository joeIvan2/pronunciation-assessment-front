// 檢測導致水平滾動條的 DOM 元素
function findHorizontalScrollCulprits() {
  const results = [];
  const viewportWidth = window.innerWidth;
  
  console.log(`🔍 檢測水平滾動問題 - 視窗寬度: ${viewportWidth}px`);
  console.log('==========================================');
  
  // 檢查所有元素
  const allElements = document.querySelectorAll('*');
  
  allElements.forEach((element, index) => {
    const rect = element.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(element);
    
    // 檢查元素是否超出視窗寬度
    const rightEdge = rect.right;
    const leftEdge = rect.left;
    const elementWidth = rect.width;
    
    // 條件：元素右邊緣超出視窗或元素本身太寬
    if (rightEdge > viewportWidth || elementWidth > viewportWidth) {
      const elementInfo = {
        element: element,
        tagName: element.tagName,
        className: element.className,
        id: element.id,
        width: Math.round(elementWidth),
        rightEdge: Math.round(rightEdge),
        leftEdge: Math.round(leftEdge),
        overflow: rightEdge - viewportWidth,
        computedWidth: computedStyle.width,
        computedMinWidth: computedStyle.minWidth,
        computedMaxWidth: computedStyle.maxWidth,
        position: computedStyle.position,
        display: computedStyle.display,
        boxSizing: computedStyle.boxSizing,
        marginLeft: computedStyle.marginLeft,
        marginRight: computedStyle.marginRight,
        paddingLeft: computedStyle.paddingLeft,
        paddingRight: computedStyle.paddingRight,
        borderLeft: computedStyle.borderLeftWidth,
        borderRight: computedStyle.borderRightWidth
      };
      
      results.push(elementInfo);
    }
  });
  
  // 按超出程度排序
  results.sort((a, b) => b.overflow - a.overflow);
  
  // 輸出結果
  console.log(`🚨 發現 ${results.length} 個可能導致水平滾動的元素:`);
  console.log('==========================================');
  
  results.forEach((item, index) => {
    console.group(`${index + 1}. ${item.tagName}${item.id ? '#' + item.id : ''}${item.className ? '.' + item.className.split(' ').join('.') : ''}`);
    console.log('📏 尺寸信息:');
    console.log(`   寬度: ${item.width}px (計算值: ${item.computedWidth})`);
    console.log(`   右邊緣: ${item.rightEdge}px`);
    console.log(`   超出視窗: ${Math.round(item.overflow)}px`);
    
    console.log('🎨 樣式信息:');
    console.log(`   display: ${item.display}`);
    console.log(`   position: ${item.position}`);
    console.log(`   box-sizing: ${item.boxSizing}`);
    console.log(`   min-width: ${item.computedMinWidth}`);
    console.log(`   max-width: ${item.computedMaxWidth}`);
    
    console.log('📦 間距信息:');
    console.log(`   margin: ${item.marginLeft} | ${item.marginRight}`);
    console.log(`   padding: ${item.paddingLeft} | ${item.paddingRight}`);
    console.log(`   border: ${item.borderLeft} | ${item.borderRight}`);
    
    // 高亮元素
    item.element.style.outline = '3px solid red';
    item.element.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
    
    console.log('🎯 元素已用紅色邊框標記');
    console.groupEnd();
  });
  
  // 檢查 body 和 html 的滾動寬度
  console.log('\n📊 頁面滾動信息:');
  console.log('==========================================');
  console.log(`document.body.scrollWidth: ${document.body.scrollWidth}px`);
  console.log(`document.documentElement.scrollWidth: ${document.documentElement.scrollWidth}px`);
  console.log(`window.innerWidth: ${window.innerWidth}px`);
  console.log(`視窗與內容寬度差: ${document.body.scrollWidth - window.innerWidth}px`);
  
  return results;
}

// 清除高亮
function clearHighlights() {
  const allElements = document.querySelectorAll('*');
  allElements.forEach(element => {
    element.style.outline = '';
    element.style.backgroundColor = '';
  });
  console.log('✅ 已清除所有高亮標記');
}

// 檢測特定容器的子元素
function checkContainer(selector) {
  const container = document.querySelector(selector);
  if (!container) {
    console.log(`❌ 找不到選擇器: ${selector}`);
    return;
  }
  
  const containerRect = container.getBoundingClientRect();
  const children = container.children;
  
  console.log(`🔍 檢查容器: ${selector}`);
  console.log(`容器寬度: ${Math.round(containerRect.width)}px`);
  console.log('==========================================');
  
  Array.from(children).forEach((child, index) => {
    const childRect = child.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(child);
    
    if (childRect.width > containerRect.width) {
      console.log(`⚠️  子元素 ${index + 1} 超出容器:`);
      console.log(`   標籤: ${child.tagName}`);
      console.log(`   類名: ${child.className}`);
      console.log(`   寬度: ${Math.round(childRect.width)}px`);
      console.log(`   超出: ${Math.round(childRect.width - containerRect.width)}px`);
      console.log(`   display: ${computedStyle.display}`);
      console.log(`   white-space: ${computedStyle.whiteSpace}`);
      console.log(`   overflow-x: ${computedStyle.overflowX}`);
      
      child.style.outline = '2px solid orange';
    }
  });
}

// 實時監控
function startHorizontalScrollMonitor() {
  let lastScrollWidth = document.body.scrollWidth;
  
  const observer = new MutationObserver(() => {
    const currentScrollWidth = document.body.scrollWidth;
    if (currentScrollWidth !== lastScrollWidth) {
      console.log(`📏 頁面寬度變化: ${lastScrollWidth}px → ${currentScrollWidth}px`);
      lastScrollWidth = currentScrollWidth;
      
      if (currentScrollWidth > window.innerWidth) {
        console.log('🚨 檢測到水平滾動條出現！');
        findHorizontalScrollCulprits();
      }
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style', 'class']
  });
  
  console.log('👀 開始監控水平滾動變化...');
  return observer;
}

// 使用說明
console.log(`
🛠️  水平滾動調試工具使用說明:
==========================================
1. findHorizontalScrollCulprits() - 找出所有導致水平滾動的元素
2. clearHighlights() - 清除紅色高亮標記
3. checkContainer('.navbar') - 檢查特定容器的子元素
4. startHorizontalScrollMonitor() - 開始實時監控

💡 建議使用順序:
1. 先執行 findHorizontalScrollCulprits()
2. 查看控制台輸出和頁面上的紅色標記
3. 針對問題元素進行修復
4. 執行 clearHighlights() 清除標記
`);

// 自動執行檢測（可選）
// findHorizontalScrollCulprits(); 