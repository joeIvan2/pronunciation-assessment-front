import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import ReactDOM from 'react-dom';
import "../styles/PronunciationAssessment.css";

// 組件導入
import ScoreBar from "../components/ScoreBar";
import WordsDisplay from "../components/WordsDisplay";
// import TagManager from "../components/TagManager"; // 不再需要，標籤管理已整合到 FavoriteList
import VoicePicker from "../components/VoicePicker";
import FavoriteList from "../components/FavoriteList";
import HistoryRecord from "../components/HistoryRecord";
import AIDataProcessor from "../components/AIDataProcessor";
import ShareData from "../components/ShareData";
import ResizableTextarea from "../components/ResizableTextarea";
import LoginModal from "../components/LoginModal";
import ShareImportModal from "../components/ShareImportModal";
import AndroidChromeModal from "../components/AndroidChromeModal";
import IOSFacebookModal from "../components/IOSFacebookModal";
import IOSLINEModal from "../components/IOSLINEModal";

// 瀏覽器環境檢測
import { isAndroidWebView } from "../utils/browserDetection";
import { Tooltip } from 'react-tooltip';

// 鉤子導入
import { useRecorder } from "../hooks/useRecorder";
import { useBackendSpeech } from "../hooks/useBackendSpeech";
import { useAzureSpeech } from "../hooks/useAzureSpeech";
import { useFirebaseAuth } from "../hooks/useFirebaseAuth";

// 工具導入
import * as storage from "../utils/storage";
import { getPracticeIdFromUrl, redirectToNewFormat, isPracticePage } from "../utils/urlUtils";
import { useParams } from "react-router-dom";
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

// 類型導入
import { SpeechAssessmentResult, Favorite, Tag } from "../types/speech";

// iOS和Facebook檢測函數
const isIOS = () => {
  return /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
};

const isFacebookInApp = () => {
  return /fban|fbav|fb_iab/i.test(navigator.userAgent.toLowerCase());
};

const isLineInApp = () => {
  return /line/i.test(navigator.userAgent.toLowerCase());
};

// 我們在storage.ts中已經更新了TabName類型，所以這裡不需要再定義

const PronunciationAssessment: React.FC = () => {
  // 路由參數
  const { slug } = useParams<{ slug: string }>();
  
  // 狀態定義
  const [result, setResult] = useState<SpeechAssessmentResult | null>(null);
  const [strictMode, setStrictMode] = useState<boolean>(() => storage.getStrictMode());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAssessing, setIsAssessing] = useState<boolean>(false);
  const [useBackend, setUseBackend] = useState<boolean>(() => storage.getUseBackend());
  const [error, setError] = useState<string | null>(null);
  
  // Azure設置
  const [azureSettings, setAzureSettings] = useState(() => storage.getAzureSettings());
  const [showAzureSettings, setShowAzureSettings] = useState<boolean>(false);
  
  // 語音設置
  const [voiceSettings, setVoiceSettings] = useState(() => storage.getVoiceSettings());
  // 新增AI語音設置
  const [selectedAIVoice, setSelectedAIVoice] = useState<string>(() => storage.getAIVoice());
  
  // 標籤系統（標籤管理已整合到 FavoriteList 中）
  const [tags, setTags] = useState<Tag[]>(() => storage.getTags());
  const [nextTagId, setNextTagId] = useState<number>(() => storage.getNextTagId());
  const [tagsLoaded, setTagsLoaded] = useState<boolean>(false);
  
  // 收藏系統
  const [favorites, setFavorites] = useState<Favorite[]>(() => storage.getFavorites());
  const [nextFavoriteId, setNextFavoriteId] = useState<number>(() => storage.getNextFavoriteId(favorites));
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [favoritesLoaded, setFavoritesLoaded] = useState<boolean>(false);

  // 通用的favorites排序函數，與UI顯示順序保持一致
  const sortFavoritesByUI = (favorites: Favorite[]): Favorite[] => {
    const collator = new Intl.Collator(undefined, {
      numeric: true,
      sensitivity: 'base',
    });
    return [...favorites].sort((a, b) => collator.compare(String(a.id), String(b.id)));
  };

  // 根据当前選擇的標籤過濾收藏列表
  const filteredFavorites = useMemo(() => {
    if (selectedTags.length === 0) {
      return favorites;
    }
    return favorites.filter(fav =>
      selectedTags.some(tagId => fav.tagIds?.includes(tagId))
    );
  }, [favorites, selectedTags]);
  
  // 文本和界面設置
  const [referenceText, setReferenceText] = useState<string>(() => storage.getReferenceText());
  const [fontSize, setFontSize] = useState<number>(() => storage.getFontSize());
  
  // 歷史記錄狀態
  const [historyRecords, setHistoryRecords] = useState<storage.HistoryItem[]>(() => storage.getHistoryRecords());
  const [isHistoryExpanded, setIsHistoryExpanded] = useState<boolean>(() => storage.getCardExpandStates().historyRecord);
  
  // 標籤頁狀態
  const [topActiveTab, setTopActiveTab] = useState<storage.TopTabName>(() => storage.getTopActiveTab());
  const [bottomActiveTab, setBottomActiveTab] = useState<storage.BottomTabName>(() => storage.getBottomActiveTab());
  
  // AI助理相关状态
  const [aiResponse, setAiResponse] = useState<string | null>(() => {
    try {
      return storage.getAIResponse();
    } catch (e) {
      console.error('加載AI響應失敗，重置為空:', e);
      return null;
    }
  });
  const [fadeEffect, setFadeEffect] = useState<boolean>(false);
  
  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const processingRef = useRef(false);
  
  // 使用自定義鉤子
  const recorder = useRecorder();
  const backendSpeech = useBackendSpeech();
  const azureSpeech = useAzureSpeech();
  const { user, signInWithGoogle, signInWithEmailPassword, signOutUser, loading: userLoading } = useFirebaseAuth();

  // Google 登入按鈕永遠顯示，不再隱藏
  const disableGoogle = false;

  // 用於跟踪最新新增的收藏項目ID
  const [lastAddedFavoriteId, setLastAddedFavoriteId] = useState<string | null>(null);
  const [highlightedFavoriteId, setHighlightedFavoriteId] = useState<string | null>(null);
  
  // 用於避免 onSnapshot 無限更新的數據鏡像
  const latestUpdateRef = useRef<{
    favorites2?: any[];
    tags2?: any[];
    historyRecords?: any[];
    shareHistory?: any[];
    promptFavorites?: any[];
  }>({});
  
  // TTS相關狀態 (只在Azure直連模式下使用流式TTS)
  const [streamLoading, setStreamLoading] = useState<boolean>(false);
  const [cacheTipVisible, setCacheTipVisible] = useState<boolean>(false);
  
  // 控制評分按鈕CSS延遲變化的狀態
  const [buttonStyleDelayed, setButtonStyleDelayed] = useState<boolean>(false);

  // 登入 Modal 相關狀態
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [loginModalMessage, setLoginModalMessage] = useState<string>('');
  const [loginModalAction, setLoginModalAction] = useState<string>('此功能');

  // 新用戶提示狀態
  const [isFirstTimeUser, setIsFirstTimeUser] = useState<boolean>(false);
  const [showAITooltip, setShowAITooltip] = useState<boolean>(false);

  // iOS Facebook 操作提示狀態
  const [showFacebookTooltip, setShowFacebookTooltip] = useState<boolean>(false);
  const [showIOSFacebookModal, setShowIOSFacebookModal] = useState<boolean>(false);

  // iOS LINE Modal 狀態
  const [showIOSLINEModal, setShowIOSLINEModal] = useState<boolean>(false);

  // 分享導入 Modal 相關狀態
  const [showShareImportModal, setShowShareImportModal] = useState<boolean>(false);
  const [shareImportId, setShareImportId] = useState<string>('');
  const [shareImportData, setShareImportData] = useState<any>(null);
  const [shareImportLoading, setShareImportLoading] = useState<boolean>(false);

  // Android WebView 提示 Modal 狀態
  const [showAndroidModal, setShowAndroidModal] = useState<boolean>(false);

  // AI prompt from URL parameter
  const [aiPromptFromURL, setAiPromptFromURL] = useState<string>('');
  
  // 自動練習模式狀態
  const [isAutoPracticeMode, setIsAutoPracticeMode] = useState(false);

  // 字典 Modal 狀態
  const [showDictModal, setShowDictModal] = useState(false);
  const [dictWord, setDictWord] = useState('');

  // 系統提醒顯示
  const [systemTip, setSystemTip] = useState<string | null>(null);

  // 監聽 iOS Facebook 操作提示事件
  useEffect(() => {
    const handleShowFacebookTooltip = () => {
      if (isIOS() && isFacebookInApp()) {
        setShowIOSFacebookModal(true);
      } else {
        setShowFacebookTooltip(true);
        // 5秒後自動關閉
        setTimeout(() => {
          setShowFacebookTooltip(false);
        }, 8000);
      }
    };

    window.addEventListener('showFacebookTooltip', handleShowFacebookTooltip);

    return () => {
      window.removeEventListener('showFacebookTooltip', handleShowFacebookTooltip);
    };
  }, []);

  // 監聽系統提示事件
  useEffect(() => {
    const handleSystemTip = (event: CustomEvent) => {
      const { message } = event.detail;
      setSystemTip(message);
      setTimeout(() => setSystemTip(null), 3000);
    };

    window.addEventListener('showSystemTip', handleSystemTip as EventListener);

    return () => {
      window.removeEventListener('showSystemTip', handleSystemTip as EventListener);
    };
  }, []);

  // 初次載入時若為 iOS Facebook In-App 直接顯示 Modal
  useEffect(() => {
    if (isIOS() && isFacebookInApp()) {
      setShowIOSFacebookModal(true);
    }
  }, []);

  // 初次載入時若為 iOS LINE In-App 直接顯示 Modal
  useEffect(() => {
    if (isIOS() && isLineInApp()) {
      setShowIOSLINEModal(true);
    }
  }, []);

  // 監聽 Android WebView 跳轉提示事件
  useEffect(() => {
    const handleShowAndroidModal = () => {
      setShowAndroidModal(true);
    };

    window.addEventListener('showAndroidChromeModal', handleShowAndroidModal);

    return () => {
      window.removeEventListener('showAndroidChromeModal', handleShowAndroidModal);
    };
  }, []);

  // 初次載入時若為 Android WebView 直接顯示 Modal
  useEffect(() => {
    if (isAndroidWebView()) {
      setShowAndroidModal(true);
    }
  }, []);

  // 檢查URL參數是否包含ai參數
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const aiParam = urlParams.get('ai');
    
    if (aiParam) {
      // 解碼URL參數
      const decodedPrompt = decodeURIComponent(aiParam);
      setAiPromptFromURL(decodedPrompt);
      // 切換到AI造句幫手tab
      setTopActiveTab('ai');
      // 儲存到storage
      storage.saveTopActiveTab('ai');
    }
  }, []);

  // 檢查URL參數是否包含登入參數
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const loginUser = urlParams.get('loginUser');
    const pwd = urlParams.get('pwd');
    
    if (loginUser && pwd && !user && !userLoading) {
      console.log('🔑 檢測到URL登入參數，嘗試自動登入:', loginUser);
      
      // 自動登入
      signInWithEmailPassword(loginUser, pwd)
        .then(() => {
          console.log('✅ URL參數自動登入成功');
          // 清除URL參數（可選）
          const newUrl = window.location.pathname;
          window.history.replaceState({}, '', newUrl);
        })
        .catch((error) => {
          console.error('❌ URL參數自動登入失敗:', error);
        });
    }
  }, [user, userLoading, signInWithEmailPassword]);

  // 自動練習模式不需要自動清理，保持開關狀態

  // 登入後載入 Firestore 收藏並在更新時同步
  useEffect(() => {
    if (user) {
      setFavoritesLoaded(false);
      (async () => {
        try {
          const { loadUserFavorites } = await import('../utils/firebaseStorage');
          const favs = await loadUserFavorites(user.uid);
          if (favs.length) {
            const sortedFavs = sortFavoritesByUI(favs);
            setFavorites(sortedFavs);
            storage.saveFavorites(sortedFavs); // 覆蓋本地資料
            setNextFavoriteId(storage.getNextFavoriteId(sortedFavs));
          } else {
            setFavorites([]);
            // 如果是新用戶（沒有收藏），設定為首次用戶
            setIsFirstTimeUser(true);
            setShowAITooltip(true);
            // 5秒後自動關閉 tooltip
            setTimeout(() => {
              setShowAITooltip(false);
            }, 5000);
          }
        } catch (err) {
          console.error('載入使用者收藏失敗:', err);
        } finally {
          setFavoritesLoaded(true);
        }
      })();
    } else {
      const localFavorites = storage.getFavorites();
      const sortedLocalFavorites = sortFavoritesByUI(localFavorites);
      setFavorites(sortedLocalFavorites);
      setFavoritesLoaded(false);
      setIsFirstTimeUser(false);
    }
  }, [user]);

  // 登入後載入 Firestore 標籤並在更新時同步
  useEffect(() => {
    if (user) {
      setTagsLoaded(false);
      (async () => {
        try {
          const { loadUserTags } = await import('../utils/firebaseStorage');
          const userTags = await loadUserTags(user.uid);
          if (userTags.length) {
            setTags(userTags);
            storage.saveTags(userTags); // 覆蓋本地資料
            // 計算下一個標籤ID
            const maxId = Math.max(...userTags.map(tag => parseInt(tag.tagId, 10) || 0), 0);
            setNextTagId(maxId + 1);
          } else {
            // 如果雲端沒有標籤，保持本地標籤
            setTags(storage.getTags());
          }
        } catch (err) {
          console.error('載入使用者標籤失敗:', err);
        } finally {
          setTagsLoaded(true);
        }
      })();
    } else {
      setTags(storage.getTags());
      setTagsLoaded(false);
    }
  }, [user]);

  // 集中監聽 Firebase 資料變化
  useEffect(() => {
    if (!user) return;

    const userDocRef = doc(db, 'users', user.uid);

    const unsubscribe = onSnapshot(
      userDocRef,
      { includeMetadataChanges: false },
      (docSnap) => {
        if (docSnap.metadata.hasPendingWrites) return;

        const data = docSnap.data();
        if (!data) return;

        // 比較內容變化，只有真的有變化才更新狀態
        if (Array.isArray(data.favorites2)) {
          const newFavorites = data.favorites2;
          // 與最新鏡像比較而非當前狀態，避免無限更新
          if (JSON.stringify(latestUpdateRef.current.favorites2) !== JSON.stringify(newFavorites)) {
            console.log('Firebase favorites2 數據變化，更新本地狀態');
            const sortedFavorites = sortFavoritesByUI(newFavorites);
            latestUpdateRef.current.favorites2 = sortedFavorites;
            setFavorites(sortedFavorites);
            storage.saveFavorites(sortedFavorites);
            setNextFavoriteId(storage.getNextFavoriteId(sortedFavorites));
          }
        }

        if (Array.isArray(data.tags2)) {
          const newTags = data.tags2;
          // 與最新鏡像比較而非當前狀態，避免無限更新
          if (JSON.stringify(latestUpdateRef.current.tags2) !== JSON.stringify(newTags)) {
            console.log('Firebase tags2 數據變化，更新本地狀態');
            latestUpdateRef.current.tags2 = newTags;
            setTags(newTags);
            storage.saveTags(newTags);
            const maxId = Math.max(
              ...newTags.map((t: any) => parseInt(t.tagId, 10) || 0),
              0
            );
            setNextTagId(maxId + 1);
          }
        }

        if (Array.isArray(data.historyRecords)) {
          const records = data.historyRecords.map((item: any) =>
            item.a !== undefined || item.b !== undefined
              ? storage.decompressHistoryItem(item)
              : item
          );
          // 與最新鏡像比較而非當前狀態，避免無限更新
          if (JSON.stringify(latestUpdateRef.current.historyRecords) !== JSON.stringify(records)) {
            console.log('Firebase historyRecords 數據變化，更新本地狀態');
            latestUpdateRef.current.historyRecords = records;
            setHistoryRecords(records);
            storage.setHistoryRecords(records);
          }
        }

        if (Array.isArray(data.shareHistory)) {
          const history = data.shareHistory.map((item: any) => ({
            hash: item.shareId,
            editPassword: item.editPassword,
            url: `${window.location.origin}/practice/${item.shareId}`,
            timestamp:
              typeof item.createdAt === 'number' ? item.createdAt : Date.now(),
          }));
          // 與最新鏡像比較，避免無限更新
          if (JSON.stringify(latestUpdateRef.current.shareHistory) !== JSON.stringify(data.shareHistory)) {
            console.log('Firebase shareHistory 數據變化，更新本地狀態');
            latestUpdateRef.current.shareHistory = data.shareHistory;
            storage.setItem('savedShareInfo', history);
            window.dispatchEvent(
              new CustomEvent('refreshShareHistory', { detail: history })
            );
          }
        }

        if (Array.isArray(data.promptFavorites)) {
          const pfavs = data.promptFavorites.map((p: any) => ({
            id: String(p.id),
            prompt: String(p.prompt),
            createdAt: typeof p.createdAt === 'number' ? p.createdAt : Date.now(),
          }));
          // 與最新鏡像比較，避免無限更新
          if (JSON.stringify(latestUpdateRef.current.promptFavorites) !== JSON.stringify(data.promptFavorites)) {
            console.log('Firebase promptFavorites 數據變化，更新本地狀態');
            latestUpdateRef.current.promptFavorites = data.promptFavorites;
            storage.savePromptFavorites(pfavs);
            window.dispatchEvent(
              new CustomEvent('refreshPromptFavorites', { detail: pfavs })
            );
          }
        }
      },
      (err) => {
        console.error('Firestore 即時同步失敗:', err);
      }
    );

    return () => unsubscribe();
  }, [user]); // 移除 favorites, tags, historyRecords 依賴項，避免無限重建監聽器

  // 移除會引起無限循環的同步 useEffect，改為只在用戶主動操作時觸發保存
  // useEffect(() => {
  //   if (user && favoritesLoaded && !isFirebaseSync) {
  //     (async () => {
  //       try {
  //         const { saveUserFavorites } = await import('../utils/firebaseStorage');
  //         await saveUserFavorites(user.uid, favorites);
  //       } catch (err) {
  //         console.error('保存使用者收藏失敗:', err);
  //       }
  //     })();
  //   }
  // }, [favorites, user, favoritesLoaded, isFirebaseSync]);

  // 移除會引起無限循環的同步 useEffect，改為只在用戶主動操作時觸發保存
  // useEffect(() => {
  //   if (user && tagsLoaded && !isFirebaseSync) {
  //     (async () => {
  //       try {
  //         const { saveUserTags } = await import('../utils/firebaseStorage');
  //         await saveUserTags(user.uid, tags);
  //       } catch (err) {
  //         console.error('保存使用者標籤失敗:', err);
  //       }
  //     })();
  //   }
  // }, [tags, user, tagsLoaded, isFirebaseSync]);

  // 處理匯入數據的回調函數
  const handleDataImported = async (newTags: Tag[], newFavorites: Favorite[]) => {
    // 先更新本地狀態，確保favorites按ID排序與UI一致
    setTags(newTags);
    const sortedFavorites = sortFavoritesByUI(newFavorites);
    setFavorites(sortedFavorites);
    setNextFavoriteId(storage.getNextFavoriteId(sortedFavorites));
    
    // 計算新的標籤ID
    if (newTags.length > 0) {
      const maxId = Math.max(...newTags.map(tag => parseInt(tag.tagId, 10) || 0), 0);
      setNextTagId(maxId + 1);
    }
    
    // 清除選擇的標籤
    setSelectedTags([]);
    
    // 如果用戶已登入，立即同步到Firebase並更新鏡像以防止監聽器覆蓋
    if (user) {
      try {
        // 立即更新鏡像數據，防止監聽器用舊數據覆蓋（使用排序後的數據）
        latestUpdateRef.current.favorites2 = sortedFavorites;
        latestUpdateRef.current.tags2 = newTags;
        
        console.log('開始同步匯入數據到Firebase...');
        
        // 並行同步到Firebase（使用排序後的數據）
        const { saveUserFavorites, saveUserTags } = await import('../utils/firebaseStorage');
        await Promise.all([
          saveUserFavorites(user.uid, sortedFavorites),
          saveUserTags(user.uid, newTags)
        ]);
        
        console.log('匯入數據已成功同步到Firebase');
        
        // 標記為已載入
        setTagsLoaded(true);
        setFavoritesLoaded(true);
        
      } catch (err) {
        console.error('同步匯入數據到Firebase失敗:', err);
        // 即使同步失敗，仍標記為已載入以避免重複載入
      setTagsLoaded(true);
      setFavoritesLoaded(true);
      }
    }
  };

  // 登入後載入使用者歷史記錄和分享歷史
  useEffect(() => {
    if (!user) return;
    
    let isCancelled = false;
    
    // 添加延遲以避免多個操作同時執行
    const timeoutId = setTimeout(async () => {
      if (isCancelled) return;
      
      try {
        // 首先創建或更新用戶基本資料
        const { createOrUpdateUserProfile, loadUserProfile } = await import('../utils/firebaseStorage');
        
        // 創建/更新用戶基本資料，包含顯示名稱和電子郵件
        await createOrUpdateUserProfile(
          user.uid, 
          user.displayName || undefined, 
          user.email || undefined
        );
        console.log('用戶基本資料已確保存在');
        
        // 載入用戶資料
        const profile = await loadUserProfile(user.uid);
        
        if (isCancelled) return;
        
        // 載入並覆蓋本地歷史記錄，遠端優先
        if (profile?.historyRecords && profile.historyRecords.length > 0) {
          const firebaseRecords = profile.historyRecords;
          storage.setHistoryRecords(firebaseRecords);
          setHistoryRecords(firebaseRecords);
        } else {
          const localRecords = storage.getHistoryRecords();
          setHistoryRecords(localRecords);
          if (localRecords.length > 0) {
            try {
              const { saveUserHistoryRecords } = await import('../utils/firebaseStorage');
              await saveUserHistoryRecords(user.uid, localRecords);
              console.log('本地歷史記錄已上傳到Firebase');
            } catch (err) {
              console.warn('上傳本地歷史記錄失敗:', err);
            }
          }
        }
        
        console.log('使用者歷史記錄載入成功');
      } catch (err) {
        if (!isCancelled) {
          console.error('載入使用者歷史記錄失敗:', err);
        }
      }
      
      // 同步分享歷史 - 稍後執行以避免衝突
      if (!isCancelled) {
        try {
          const { syncShareHistoryFromFirebase, syncShareHistoryToFirebase } = await import('../utils/storage');
          
          // 先將本地未同步的分享歷史同步到Firebase
          await syncShareHistoryToFirebase(user.uid);
          
          // 等待一小段時間再執行下一步
          await new Promise(resolve => setTimeout(resolve, 200));
          
          if (!isCancelled) {
            // 再從Firebase載入完整的分享歷史到本地
            await syncShareHistoryFromFirebase(user.uid);
            console.log('分享歷史同步完成');
          }
        } catch (err) {
          if (!isCancelled) {
            console.error('同步分享歷史失敗:', err);
          }
        }
      }
    }, 500); // 延遲500毫秒執行
    
    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, [user]);

  // 字型大小變更時儲存到 localStorage
  useEffect(() => {
    storage.saveFontSize(fontSize);
  }, [fontSize]);

  // 語音設定變更時儲存到 localStorage
  useEffect(() => {
    storage.saveVoiceSettings(voiceSettings);
  }, [voiceSettings]);

  // AI語音選擇變更時儲存到 localStorage
  useEffect(() => {
    storage.saveAIVoice(selectedAIVoice);
  }, [selectedAIVoice]);

  // 歷史記錄同步（當用戶登入且歷史記錄變化時）
  // 移除此 useEffect 以避免無限循環，改為依賴 onSnapshot 監聽器進行即時同步
  // useEffect(() => {
  //   if (!user) return;

  //   const timeoutId = setTimeout(async () => {
  //     try {
  //       const { saveUserHistoryRecords } = await import('../utils/firebaseStorage');
  //       await saveUserHistoryRecords(user.uid, historyRecords);
  //       console.log('歷史記錄已同步到Firebase');
  //     } catch (err) {
  //       console.error('保存歷史記錄失敗:', err);
  //       // 不要拋出錯誤，只記錄
  //     }
  //   }, 1000); // 1秒防抖，因為歷史記錄更新較少

  //   return () => clearTimeout(timeoutId);
  // }, [historyRecords, user]);

  // 新增streaming相關狀態和refs
  const streamingCallbackRef = useRef<((chunk: Blob) => void) | null>(null);
  
  // 處理streaming錄音評估
  const handleStreamingAssessment = useCallback(async (textToAssess?: string) => {
    if (!useBackend) {
      console.log('非後端模式，不支持streaming');
      return;
    }

    // 使用傳入的文本或當前狀態文本
    const assessmentText = textToAssess || referenceText;

    try {
      setError(null);
      setResult(null);
      
      console.log('開始streaming評估...');
      
      // 啟動streaming評估
      const chunkHandler = await backendSpeech.startStreamingAssessment(
        assessmentText,
        strictMode,
        (progress) => {
          console.log(`Streaming進度: ${progress}%`);
          // 可以在這裡更新UI進度條
        },
        (partialResult) => {
          console.log('收到部分結果:', partialResult);
          // 可以在這裡顯示實時結果
        }
      );
      
      streamingCallbackRef.current = chunkHandler;
      
      // 開始streaming錄音
      await recorder.startStreamingRecording(chunkHandler);
      playBeepSound();
      
    } catch (err) {
      console.error('Streaming評估失敗:', err);
      setError(`Streaming評估失敗: ${err instanceof Error ? err.message : String(err)}`);
      setIsAssessing(false);
      setButtonStyleDelayed(false);
    }
  }, [backendSpeech, referenceText, strictMode, useBackend, recorder]);

  // 停止streaming評估並獲取結果
  const stopStreamingAssessment = useCallback(async () => {
    try {
      console.log('停止streaming評估...');
      
      // 停止錄音
      recorder.stopStreamingRecording();
      
      // 獲取最終評估結果
      if (backendSpeech.isStreaming) {
        const finalResult = await backendSpeech.stopStreamingAssessment();
        
        if (finalResult) {
          setResult(finalResult);
          console.log('獲取到最終streaming評估結果:', finalResult);
        }
      }
      
      streamingCallbackRef.current = null;
      
    } catch (err) {
      console.error('停止streaming評估失敗:', err);
      setError(`停止streaming評估失敗: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsAssessing(false);
      setButtonStyleDelayed(false);
    }
  }, [recorder, backendSpeech]);

  // 處理錄音狀態變化 - 更新以支持streaming
  useEffect(() => {
    // 後端模式下不再需要處理傳統錄音完成事件，直接使用streaming
    if (recorder.error) {
      setError(recorder.error);
    }
  }, [recorder.error]);

  // 登入檢查輔助函式
  const checkLoginAndShowModal = (actionName: string, customMessage?: string): boolean => {
    if (!user) {
      setLoginModalAction(actionName);
      setLoginModalMessage(customMessage || '');
      setShowLoginModal(true);
      return false;
    }
    return true;
  };

  // 處理登入 Modal
  const handleLoginModalClose = () => {
    setShowLoginModal(false);
  };

  const handleLoginFromModal = async () => {
    try {
      await signInWithGoogle();
      setShowLoginModal(false);
    } catch (error) {
      console.error('登入失敗:', error);
    }
  };



  // 收藏夾相關函數
  const addToFavorites = (text: string | string[], tagIds: string[] = []) => {
    // 檢查登入狀態
    if (!checkLoginAndShowModal(
      '加入我的最愛',
      '將句子加入我的最愛需要登入，這樣您就可以在不同裝置間同步您的收藏。'
    )) {
      return;
    }
    // 處理空輸入
    if (!text || (Array.isArray(text) && text.length === 0)) {
      setSystemTip("請先輸入句子再加入我的最愛！");
      return;
    }

    // 確保 text 為數組形式以統一處理
    const textsToAdd = Array.isArray(text) ? text : [text];
    const newFavorites: Favorite[] = [];
    let currentNextId = storage.getNextFavoriteId(favorites);
    let firstNewFavoriteId: string | null = null;

    // 處理每個文本
    for (let i = 0; i < textsToAdd.length; i++) {
      const currentText = textsToAdd[i];
      
      // 確保currentText是字符串並且不為空
      if (typeof currentText !== 'string' || !currentText) {
        console.warn('跳過非字符串或空值:', currentText);
        continue;
    }
      
      // 跳過空字符串
      const trimmedText = currentText.trim();
      if (!trimmedText) continue;
      
      // 創建新收藏項目
      const newId = currentNextId.toString();
      // 記錄第一個新新增的ID
      if (firstNewFavoriteId === null) {
        firstNewFavoriteId = newId;
    }
      
      const newFavorite = {
        id: newId,
        text: trimmedText,
        tagIds: tagIds.length ? tagIds : selectedTags, // 使用當前選中的標籤或指定的標籤
        createdAt: Date.now() + i // 新增索引偏移確保順序正確
      };
      console.log(`[addToFavorites] 新增 favorite id=${newId}, text=${trimmedText}`);
      newFavorites.push(newFavorite);
      currentNextId++;
    }
    
    // 如果沒有新增項目則直接返回
    if (newFavorites.length === 0) {
      setSystemTip("沒有有效的句子可以新增！");
      setTimeout(() => setSystemTip(null), 3000);
      return;
    }
    
    // 合併所有收藏項目並按ID排序，與UI顯示順序一致
    const allFavorites = [...favorites, ...newFavorites];
    const sortedFavorites = sortFavoritesByUI(allFavorites);
    
    setFavorites(sortedFavorites);
    
    // 更新 nextFavoriteId
    setNextFavoriteId(currentNextId);
    
    // 主動保存到 Firebase - 只有在數據完全載入後才同步
    if (user && favoritesLoaded && tagsLoaded) {
      (async () => {
        try {
          const { saveUserFavorites } = await import('../utils/firebaseStorage');
          await saveUserFavorites(user.uid, sortedFavorites);
          console.log('新增收藏已同步到 Firebase');
        } catch (err) {
          console.error('同步新增收藏到 Firebase 失敗:', err);
        }
      })();
    } else if (user && (!favoritesLoaded || !tagsLoaded)) {
      console.log('數據尚未完全載入，暫時跳過新增收藏同步到 Firebase');
    }
    
    // 如果是批次新增，顯示新增成功的提示
    if (Array.isArray(text) && newFavorites.length > 0) {
      console.log(`成功新增 ${newFavorites.length} 個句子到收藏`);
      setSystemTip(`已成功將 ${newFavorites.length} 個句子加入收藏！`);
      setTimeout(() => setSystemTip(null), 3000);
    } else if (!Array.isArray(text) && newFavorites.length > 0) {
      setSystemTip('已新增到收藏');
      setTimeout(() => setSystemTip(null), 3000);
    }
    
    // 切換到我的最愛標籤頁
    handleTabChange('favorites');
    
    // 設置最後新增的收藏項目ID，用於聚焦
    if (firstNewFavoriteId) {
      setLastAddedFavoriteId(firstNewFavoriteId);
      // 同時設置高亮，使新增的句子保持選中狀態
      setHighlightedFavoriteId(firstNewFavoriteId);
    }
  };
  
  const removeFromFavorite = (id: string) => {
    const updatedFavorites = favorites.filter(fav => fav.id !== id);
    setFavorites(updatedFavorites);
    
    // 主動保存到 Firebase - 只有在數據完全載入後才同步
    if (user && favoritesLoaded && tagsLoaded) {
      (async () => {
        try {
          const { saveUserFavorites } = await import('../utils/firebaseStorage');
          await saveUserFavorites(user.uid, updatedFavorites);
          console.log('刪除收藏已同步到 Firebase');
        } catch (err) {
          console.error('同步刪除收藏到 Firebase 失敗:', err);
        }
      })();
    } else if (user && (!favoritesLoaded || !tagsLoaded)) {
      console.log('數據尚未完全載入，暫時跳過刪除收藏同步到 Firebase');
    }
  };
  
  // 取得 localStorage key
  const getCurrentFavoriteIdKey = (user: any) => user && user.uid ? `currentFavoriteId_${user.uid}` : 'currentFavoriteId_guest';
  
  // 簡化 currentFavoriteId 初始化，在 favorites 載入完成後再設定
  const getInitialCurrentFavoriteId = () => {
    // 初始化時不設定任何值，等待 favorites 載入完成
    return null;
  };
  // 統一使用 setCurrentFavoriteId，localStorage 由 useEffect 管理
  const [currentFavoriteId, setCurrentFavoriteId] = useState<string | null>(() => getInitialCurrentFavoriteId());
  
  // 在 favorites 完全載入後，設定 currentFavoriteId
  useEffect(() => {
    // 只有在 favoritesLoaded 為 true 且 currentFavoriteId 尚未設定時才執行
    if (favoritesLoaded && currentFavoriteId === null && filteredFavorites.length > 0) {
      console.log('[useEffect:favoritesLoaded] favorites 已載入，開始設定 currentFavoriteId');
      
      if (user) {
        // 登入用戶：嘗試從 localStorage 讀取
        const key = getCurrentFavoriteIdKey(user);
        const storedId = localStorage.getItem(key);
        console.log('[useEffect:favoritesLoaded] localStorage key:', key, 'storedId:', storedId);
        
        if (storedId && filteredFavorites.some(f => f.id === storedId)) {
          console.log('[useEffect:favoritesLoaded] 使用localStorage中的有效值:', storedId);
          const fav = filteredFavorites.find(f => f.id === storedId)!;
          setReferenceText(fav.text);
          setCurrentFavoriteId(storedId);
          storage.saveReferenceText(fav.text);
        } else {
          // localStorage 無有效值，使用 ID 最小的句子
          const minIdFavorite = filteredFavorites.reduce((min, f) => (f.id < min.id ? f : min), filteredFavorites[0]);
          console.log('[useEffect:favoritesLoaded] 使用ID最小的收藏:', minIdFavorite.id);
          setReferenceText(minIdFavorite.text);
          setCurrentFavoriteId(minIdFavorite.id);
          storage.saveReferenceText(minIdFavorite.text);
        }
      } else {
        // 未登入用戶：使用預設值 "0" 或 ID 最小的句子
        if (filteredFavorites.some(f => f.id === "0")) {
          console.log('[useEffect:favoritesLoaded] 未登入用戶，使用預設值 "0"');
          const fav = filteredFavorites.find(f => f.id === "0")!;
          setReferenceText(fav.text);
          setCurrentFavoriteId("0");
          storage.saveReferenceText(fav.text);
        } else {
          const minIdFavorite = filteredFavorites.reduce((min, f) => (f.id < min.id ? f : min), filteredFavorites[0]);
          console.log('[useEffect:favoritesLoaded] 未登入用戶，使用ID最小的收藏:', minIdFavorite.id);
          setReferenceText(minIdFavorite.text);
          setCurrentFavoriteId(minIdFavorite.id);
          storage.saveReferenceText(minIdFavorite.text);
        }
      }
    }
  }, [favoritesLoaded, currentFavoriteId, filteredFavorites, user]); // 依賴 favoritesLoaded 狀態
  
  const loadFavorite = (id: string) => {
    const favorite = favorites.find(fav => fav.id === id);
    if (favorite) {
      setReferenceText(favorite.text);
      
      setCurrentFavoriteId(favorite.id);
      
      storage.saveReferenceText(favorite.text);
      setHighlightedFavoriteId(id);
      handleTabChange('input');
      if (inputContainerRef.current) {
        inputContainerRef.current.focus();
      }
    }
  };
  
  const updateFavoriteTags = (id: string, tagIds: string[]) => {
    const updatedFavorites = favorites.map(fav => 
      fav.id === id 
        ? { ...fav, tagIds: tagIds } 
        : fav
    );
    
    setFavorites(updatedFavorites);
  };
  
  const toggleTagOnFavorite = (favoriteId: string, tagId: string) => {
    const updatedFavorites = favorites.map(fav => {
      if (fav.id === favoriteId) {
        // 如果標籤已存在，則移除；否則新增
        const hasTag = fav.tagIds.includes(tagId);
        return {
          ...fav,
          tagIds: hasTag 
            ? fav.tagIds.filter(id => id !== tagId) 
            : [...fav.tagIds, tagId]
        };
      }
      return fav;
    });
    
    setFavorites(updatedFavorites);
    
    // 主動保存到 Firebase - 只有在數據完全載入後才同步
    if (user && favoritesLoaded && tagsLoaded) {
      (async () => {
        try {
          const { saveUserFavorites } = await import('../utils/firebaseStorage');
          await saveUserFavorites(user.uid, updatedFavorites);
          console.log('切換收藏標籤已同步到 Firebase');
        } catch (err) {
          console.error('同步切換收藏標籤到 Firebase 失敗:', err);
        }
      })();
    } else if (user && (!favoritesLoaded || !tagsLoaded)) {
      console.log('數據尚未完全載入，暫時跳過同步到 Firebase');
    }
  };
  
  // 標籤選擇相關
  const toggleTagSelection = (tagId: string) => {
    const updatedSelection = selectedTags.includes(tagId)
      ? selectedTags.filter(id => id !== tagId)
      : [...selectedTags, tagId];
    
    setSelectedTags(updatedSelection);
  };
  
  const clearTagSelection = () => {
    setSelectedTags([]);
  };
  
  // 處理參考文本變更
  const handleReferenceTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setReferenceText(newText);
    storage.saveReferenceText(newText);
  };
  
  // 字體大小調整
  const decreaseFontSize = () => {
    const newSize = Math.max(fontSize - 2, 12);
    setFontSize(newSize);
    storage.saveFontSize(newSize);
  };
  
  const increaseFontSize = () => {
    const newSize = fontSize + 1;
      setFontSize(newSize);
      storage.saveFontSize(newSize);
  };
  
  // 語音設置相關
  const handleSpeechRateChange = (rate: number) => {
    const updatedSettings = { ...voiceSettings, rate: rate };
    setVoiceSettings(updatedSettings);
    storage.saveVoiceSettings(updatedSettings);
  };
  
  // 前一條和下一條句子功能
  const goToPreviousSentence = () => {
    const currentIndex = filteredFavorites.findIndex(
      fav => fav.id === currentFavoriteId
    );
    if (filteredFavorites.length === 0) {
      return;
    }
    let newIndex;
    if (currentIndex === -1) {
      newIndex = filteredFavorites.length - 1;
    } else {
      newIndex = (currentIndex - 1 + filteredFavorites.length) % filteredFavorites.length;
    }
    const target = filteredFavorites[newIndex];
    if (target) {
      setReferenceText(target.text);
      setCurrentFavoriteId(target.id);
      storage.saveReferenceText(target.text);
      setHighlightedFavoriteId(target.id);
    }
  };
  
  const goToNextSentence = () => {
    const currentIndex = filteredFavorites.findIndex(
      fav => fav.id === currentFavoriteId
    );
    if (filteredFavorites.length === 0) {
      return;
    }
    let newIndex;
    if (currentIndex === -1) {
      newIndex = 0;
    } else {
      newIndex = (currentIndex + 1) % filteredFavorites.length;
    }
    const target = filteredFavorites[newIndex];
    if (target) {
      setReferenceText(target.text);
      setCurrentFavoriteId(target.id);
      storage.saveReferenceText(target.text);
      setHighlightedFavoriteId(target.id);
    }
  };

  const goToRandomSentence = async () => {
    const currentUser = userRef.current;
    if (!favoritesLoaded || filteredFavorites.length === 0) {
      return;
    }
    const randomIndex = Math.floor(Math.random() * filteredFavorites.length);
    const target = filteredFavorites[randomIndex];
    if (target) {
      setReferenceText(target.text);
      setCurrentFavoriteId(target.id);
      storage.saveReferenceText(target.text);
      setHighlightedFavoriteId(target.id);
      setTimeout(async () => {
        try {
          setIsLoading(true);
          setStreamLoading(true);
          setError(null);
          const result = await azureSpeech.speakWithAIServerStream(target.text, selectedAIVoice, voiceSettings.rate);
          if (isAutoPracticeMode) {
            handleAutoPracticeAfterSpeak(target.text);
          }
        } catch (error) {
          console.error('播放隨機句子失敗:', error);
          setError(`播放隨機句子失敗: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
          setIsLoading(false);
          setStreamLoading(false);
        }
      }, 100);
    }
  };

  // === 補上三個函式 ===
  // 播放BEEP聲
  const playBeepSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  };

  // 精確檢測音頻播放完成
  const waitForAudioToFinish = (callback: () => void) => {
    const originalConsoleLog = console.log;
    let audioFinishedDetected = false;
    console.log = function(...args) {
      originalConsoleLog.apply(console, args);
      const message = args.join(' ');
      if (message.includes('WebM播放完成') && !audioFinishedDetected) {
        audioFinishedDetected = true;
        console.log = originalConsoleLog;
        setTimeout(() => { callback(); }, 1000);
      }
    };
    setTimeout(() => {
      if (!audioFinishedDetected) {
        console.log = originalConsoleLog;
        const checkAudioFinished = () => {
          const hasPlayingAudio = azureSpeech.isAudioPlaying();
          const isSpeaking = speechSynthesis.speaking;
          if (!hasPlayingAudio && !isSpeaking) {
            setTimeout(() => { callback(); }, 3000);
          } else {
            setTimeout(checkAudioFinished, 100);
          }
        };
        checkAudioFinished();
      }
    }, 5000);
  };

  // 切換自動練習模式
  const toggleAutoPracticeMode = () => {
    setIsAutoPracticeMode(!isAutoPracticeMode);
    if (!isAutoPracticeMode) {
      setSystemTip('已開啟自動播放後錄音');
    } else {
      setSystemTip('已關閉自動播放後錄音');
    }
    setTimeout(() => setSystemTip(null), 3000);
    if (isAutoPracticeMode && isAssessing) {
      stopAssessment();
    }
  };
  // === 補上三個函式結束 ===

  // 自動練習邏輯：在播放真正結束後自動開始錄音
  const handleAutoPracticeAfterSpeak = (targetText?: string) => {
    if (!isAutoPracticeMode) return;
    
    waitForAudioToFinish(() => {
      if (!isAutoPracticeMode) return; // 再次確認模式還開著
      
              setTimeout(() => {
          if (isAutoPracticeMode && !isAssessing) {
            // 直接使用播放的文本進行錄音，確保完全一致
            if (targetText) {
              // 同時更新狀態供UI顯示
              setReferenceText(targetText);
              storage.saveReferenceText(targetText);
              
              // 直接用播放的文本錄音
              handleAutoAssessment(targetText);
            } else {
              handleAssessmentButtonClick();
            }
          }
        }, 300);
    });
  };

  // 點擊字典按鈕時，根據 localStorage 取得最後一次 focus 的單字並開啟字典
  const openDictionaryAtCaret = () => {
    let word = localStorage.getItem('lastFocusedWord') || '';
    setDictWord(word);
    setShowDictModal(true);
  };

  // 當 textarea 被 focus/click/select 時，記錄當前游標位置的單字到 localStorage
  const handleTextareaWordUpdate = () => {
    const textarea = textareaRef.current;
    let word = '';
    if (textarea) {
      const text = textarea.value;
      const start = textarea.selectionStart || 0;
      const end = textarea.selectionEnd || start;
      if (start !== end) {
        word = text.slice(start, end).trim();
      } else {
        const left = text.slice(0, start);
        const right = text.slice(start);
        const leftMatch = left.match(/[A-Za-z'-]+$/);
        const rightMatch = right.match(/^[A-Za-z'-]+/);
        word = `${leftMatch ? leftMatch[0] : ''}${rightMatch ? rightMatch[0] : ''}`;
      }
      word = word.replace(/^[^A-Za-z'-]+|[^A-Za-z'-]+$/g, '');
    }
    localStorage.setItem('lastFocusedWord', word);
  };

  // 保存 Azure key/region
  const saveAzureSettings = () => {
    storage.saveAzureSettings(azureSettings.key, azureSettings.region);
    setShowAzureSettings(false);
    if (!useBackend) {
      setSystemTip("Azure 設定已保存！");
    } else {
      // 如果原本在後端模式，保存完直接切到直連模式
      setUseBackend(false);
      storage.saveUseBackend(false);
      setSystemTip("已切換至直連 Azure 模式");
    }
  };

  // 移除標籤展開狀態處理函數 - 標籤管理已整合到 FavoriteList
  


  // 歷史記錄相關函數
    const handleDeleteHistoryRecord = async (id: string) => {
    try {
      if (user) {
        // 使用支援Firebase同步的刪除函數
        await storage.deleteHistoryRecordWithSync(id, user.uid);
      } else {
        // 未登入用戶只更新本地存儲
        storage.deleteHistoryRecord(id);
      }
      setHistoryRecords(storage.getHistoryRecords());
    } catch (error) {
      console.error('刪除歷史記錄失敗:', error);
      // 即使同步失敗，仍更新本地顯示
      setHistoryRecords(storage.getHistoryRecords());
    }
  };

  const handleClearHistoryRecords = async () => {
    try {
      if (user) {
        // 使用支援Firebase同步的清空函數
        await storage.clearHistoryRecordsWithSync(user.uid);
      } else {
        // 未登入用戶只更新本地存儲
        storage.clearHistoryRecords();
      }
      setHistoryRecords([]);
    } catch (error) {
      console.error('清空歷史記錄失敗:', error);
      // 即使同步失敗，仍更新本地顯示
      setHistoryRecords([]);
    }
  };
  
  const handleHistoryExpandToggle = () => {
    const newState = !isHistoryExpanded;
    setIsHistoryExpanded(newState);
    storage.saveCardExpandState('historyRecord', newState);
  };
  
  const handleLoadHistoryText = (text: string) => {
    setReferenceText(text);
    storage.saveReferenceText(text);
  };

  // 將評估結果新增到歷史記錄
  useEffect(() => {
    if (result) {
      // 提取單詞評分數據
      let words: any[] = [];
      let recognizedText = '';
      try {
        const nbestArray = result.NBest || result.nBest || result.nbest;
        if (Array.isArray(nbestArray) && nbestArray.length > 0) {
          const nbest = nbestArray[0];
          words = nbest.Words || (nbest as any).words || [];
          // 优先获取识别文本
          recognizedText = nbest.Display || nbest.display || result.DisplayText || result.text || '';
        } else {
          // 後端扁平化結果
          recognizedText = result.DisplayText || result.text || '';
        }
      } catch (err) {
        console.error('提取單詞評分數據失敗:', err);
        recognizedText = result.DisplayText || result.text || '';
      }

      // 生成一個唯一ID，使用時間戳加隨機數
      const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // 檢查當前記錄是否已經存在相似記錄（同一文本和相近時間）
      const existingRecords = storage.getHistoryRecords();
      const last5Seconds = Date.now() - 5000; // 5秒內
      
      const hasSimilarRecord = existingRecords.some(record => 
        (record.recognizedText === recognizedText || record.text === referenceText) && 
        record.timestamp > last5Seconds
      );
      
      // 只有不存在相似記錄時才新增
      if (!hasSimilarRecord) {
        const newRecord = {
          text: referenceText,
          scoreAccuracy: result.accuracyScore || 0,
          scoreFluency: result.fluencyScore || 0,
          scoreCompleteness: result.completenessScore || 0,
          scorePronunciation: result.pronunciationScore || 0,
          recognizedText: recognizedText,
          words: words // 保存單詞評分數據
        };
        
        // 新增到本地存儲
        storage.addHistoryRecord(newRecord);
        const updatedRecords = storage.getHistoryRecords();
        setHistoryRecords(updatedRecords);
        
        // 如果用戶已登入，同步到 Firebase
        if (user) {
          (async () => {
            try {
              const { saveUserHistoryRecords } = await import('../utils/firebaseStorage');
              await saveUserHistoryRecords(user.uid, updatedRecords);
              console.log('新增歷史記錄已同步到 Firebase');
            } catch (err) {
              console.error('同步新增歷史記錄到 Firebase 失敗:', err);
            }
          })();
        }
      } else {
        console.log('檢測到重複的歷史記錄，已忽略');
      }
    }
  }, [result, referenceText]);

  // 處理標籤頁切換
  const handleTabChange = (tab: storage.TabName) => {
    // 處理頂部輸入區域的切換
    if (tab === 'input' || tab === 'ai') {
      setTopActiveTab(tab as storage.TopTabName);
      try {
        storage.saveTopActiveTab(tab as storage.TopTabName);
      } catch (e) {
        console.log('保存頂部標籤頁狀態失敗，可能處於無痕模式');
      }
      
      // 在切換到頂部標籤頁時重置lastAddedFavoriteId
      setLastAddedFavoriteId(null);
    } 
    // 處理底部標籤頁區域的切換
    else {
      setBottomActiveTab(tab as storage.BottomTabName);
      try {
        storage.saveBottomActiveTab(tab as storage.BottomTabName);
      } catch (e) {
        console.log('保存底部標籤頁狀態失敗，可能處於無痕模式');
      }
      
      // 如果不是切換到收藏標籤頁，則重置lastAddedFavoriteId
      if (tab !== 'favorites') {
        setLastAddedFavoriteId(null);
      }
    }
  };

  // 處理AI回應
  const handleAIResponseReceived = () => {
    // 设置渐变效果
    setFadeEffect(true);
    
    // 500毫秒后取消渐变效果
    setTimeout(() => {
      setFadeEffect(false);
    }, 500);
  };

  // 当 aiResponse 变化时保存到本地存储
  useEffect(() => {
    try {
      storage.saveAIResponse(aiResponse);
    } catch (e) {
      console.error('保存AI響應失敗:', e);
    }
  }, [aiResponse]);

  // 檢查URL參數並自動加載分享數據（支持新舊格式）
  useEffect(() => {
    // 處理舊格式URL的重定向
    redirectToNewFormat();
    
    // 獲取練習ID（支持新舊格式）
    const practiceId = slug || getPracticeIdFromUrl();
    
    if (practiceId && practiceId.trim() !== '') {
      console.log('檢測到練習ID:', practiceId);
      
      // 設置分享導入數據
      setShareImportId(practiceId);
      
      // 預載入分享數據用於預覽
      const loadSharePreview = async () => {
        try {
          setShareImportLoading(true);
          const result = await storage.loadFromHash(practiceId);
          
          if (result.success && result.data) {
            setShareImportData(result.data);
            

            
            // 每次都顯示分享導入 modal
            setShowShareImportModal(true);
          } else {
            setError(`無法載入分享數據: ${result.error || '未知錯誤'}`);
          }
        } catch (err) {
          console.error('載入分享數據出錯:', err);
          setError(`載入分享數據失敗: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
          setShareImportLoading(false);
        }
      };
      
      loadSharePreview();
    }
  }, [slug]); // 依賴於slug參數的變化



  // 統一的開始評估入口 - 更新以支持streaming
  // 包裝函數用於按鈕點擊事件
  const handleStartAssessment = () => {
    startAssessment();
  };

  // 統一的評估按鈕事件處理器
  const handleAssessmentButtonClick = () => {
    if (isAssessing || recorder.recording) {
      stopAssessment();
    } else {
      handleStartAssessment();
    }
  };

  // 自動錄音用的事件處理器，可以指定文本
  const handleAutoAssessment = (textToUse: string) => {
    startAssessment(textToUse);
  };

  const startAssessment = async (targetText?: string) => {
    // 使用指定的文本或當前的referenceText
    const textToAssess = targetText || referenceText;
    
    try {
      setError(null);
      setResult(null);
      setIsAssessing(true);
      
  
      
      // 延遲0.5秒後改變按鈕CSS樣式
      setTimeout(() => {
        setButtonStyleDelayed(true);
      }, 500);
      
      if (useBackend) {
        // 使用後端API - 直接使用streaming模式
        await handleStreamingAssessment(textToAssess);
      } else {
        // 直接使用Azure
        if (!azureSettings.key || !azureSettings.region) {
          setError('請先設置Azure API key和區域');
          setIsAssessing(false);
          return;
        }
        
        setIsLoading(true);
        
        const result = await azureSpeech.assessWithAzure(
          textToAssess, 
          strictMode,
          azureSettings
        );
        
        if (result) {
          setResult(result);
        }
      }
    } catch (err) {
      console.error('啟動評估失敗:', err);
      setError(`啟動評估失敗: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      if (!useBackend) {
        setIsAssessing(false);
        setIsLoading(false);
        setButtonStyleDelayed(false);
      }
    }
  };
  
  // 停止評估 - 更新以支持streaming
  const stopAssessment = () => {
    if (useBackend && (recorder.streamingActive || backendSpeech.isStreaming)) {
      // Streaming模式
      stopStreamingAssessment();
    } else if (recorder.recording) {
      // 傳統錄音模式 (僅用於Azure直連)
      recorder.stopRecording();
    }
    
    azureSpeech.cancelAzureSpeech();
    setIsAssessing(false);
    setButtonStyleDelayed(false);
  };
  
  // 統一的文本轉語音入口 - 只使用流式TTS
  const speakText = async () => {
    try {
      if (!referenceText) {
        setSystemTip("請先輸入要發音的文字！");
        return;
      }
      
      setIsLoading(true);
      setStreamLoading(true);
      setError(null);
      
      // 統一使用流式TTS
      const result = await azureSpeech.speakWithAIServerStream(referenceText, selectedAIVoice, voiceSettings.rate);
      console.log("流式TTS已完成", result);
      
      // 播放完成後，如果啟用了自動練習模式，則開始精確的音頻檢測
      if (isAutoPracticeMode) {
        // 立即開始精確的音頻播放完成檢測，使用當前文本
        handleAutoPracticeAfterSpeak(referenceText);
      }
        
    } catch (err) {
      console.error('流式語音合成失敗:', err);
      setError(`流式語音合成失敗: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
      setStreamLoading(false);
    }
  };
  
  // 處理粘貼事件，支持文本和圖片
  const handlePaste = async (e: React.ClipboardEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      // 檢查是否有圖片
      if (e.clipboardData.files.length > 0) {
        const file = e.clipboardData.files[0];
        
        if (file.type.startsWith('image/')) {
          // 動態導入Tesseract.js
          try {
            const Tesseract = await import('tesseract.js');
            // 處理圖片OCR
            setIsLoading(true);
            setError(null);
            const result = await Tesseract.default.recognize(file, 'eng+chi_sim');
            const text = result.data.text.trim();
            setReferenceText(text);
          } catch (ocrError) {
            console.error("OCR庫加載失敗:", ocrError);
            setError(`OCR庫加載失敗: ${ocrError instanceof Error ? ocrError.message : String(ocrError)}`);
          }
          setIsLoading(false);
          return;
        }
      }
      
      // 處理純文本
      let text = e.clipboardData.getData('text').trim();
      setReferenceText(text);
    } catch (error) {
      console.error("粘貼處理出錯:", error);
      setError(`粘貼內容處理失敗: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 標籤相關函數
  const addTag = (name: string, color = '#' + Math.floor(Math.random()*16777215).toString(16)) => {
    // 檢查登入狀態
    if (!checkLoginAndShowModal(
      '新增標籤',
      '新增自訂標籤需要登入，這樣您的標籤就可以在不同裝置間同步。'
    )) {
      return;
    }

    // 檢查ID是否存在，如果存在則遞增直到找到未使用的ID
    let currentNextId = nextTagId;
    let idStr = currentNextId.toString();
    
    // 檢查tagId是否已存在
    while (tags.some(tag => tag.tagId === idStr)) {
      currentNextId++;
      idStr = currentNextId.toString();
      console.log(`標籤ID "${(currentNextId-1)}" 已存在，嘗試使用新ID "${idStr}"`);
    }
    
    const newTag: Tag = {
      tagId: idStr,
      name: name,
      color: color,
      createdAt: Date.now()
    };
    
    const updatedTags = [...tags, newTag];
    setTags(updatedTags);
    storage.saveTags(updatedTags);
    
    // 保存遞增後的ID
    const newNextId = currentNextId + 1;
    setNextTagId(newNextId);
    storage.saveNextTagId(newNextId);
    
    // 主動保存到 Firebase - 只有在數據完全載入後才同步
    if (user && favoritesLoaded && tagsLoaded) {
      (async () => {
        try {
          const { saveUserTags } = await import('../utils/firebaseStorage');
          await saveUserTags(user.uid, updatedTags);
          console.log('新增標籤已同步到 Firebase');
        } catch (err) {
          console.error('同步新增標籤到 Firebase 失敗:', err);
        }
      })();
    } else if (user && (!favoritesLoaded || !tagsLoaded)) {
      console.log('數據尚未完全載入，暫時跳過新增標籤同步到 Firebase');
    }
    
    return newTag.tagId; // 返回新創建的標籤ID
  };
  
  const editTag = (tagId: string, newName: string, newColor?: string) => {
    const updatedTags = tags.map(tag => 
      tag.tagId === tagId 
        ? { ...tag, name: newName || tag.name, color: newColor || tag.color } 
        : tag
    );
    
    setTags(updatedTags);
    storage.saveTags(updatedTags);
    
    // 主動保存到 Firebase - 只有在數據完全載入後才同步
    if (user && favoritesLoaded && tagsLoaded) {
      (async () => {
        try {
          const { saveUserTags } = await import('../utils/firebaseStorage');
          await saveUserTags(user.uid, updatedTags);
          console.log('編輯標籤已同步到 Firebase');
        } catch (err) {
          console.error('同步編輯標籤到 Firebase 失敗:', err);
        }
      })();
    } else if (user && (!favoritesLoaded || !tagsLoaded)) {
      console.log('數據尚未完全載入，暫時跳過編輯標籤同步到 Firebase');
    }
  };
  
  const deleteTag = (tagId: string) => {
    // 刪除標籤
    const updatedTags = tags.filter(tag => tag.tagId !== tagId);
    setTags(updatedTags);
    storage.saveTags(updatedTags);
    
    // 從所有收藏中移除該標籤
    const updatedFavorites = favorites.map(favorite => ({
      ...favorite,
      tagIds: favorite.tagIds.filter(tid => tid !== tagId)
    }));
    
    setFavorites(updatedFavorites);
    
    // 主動保存到 Firebase - 只有在數據完全載入後才同步
    if (user && favoritesLoaded && tagsLoaded) {
      (async () => {
        try {
          const { saveUserTags, saveUserFavorites } = await import('../utils/firebaseStorage');
          await saveUserTags(user.uid, updatedTags);
          await saveUserFavorites(user.uid, updatedFavorites);
          console.log('刪除標籤已同步到 Firebase');
        } catch (err) {
          console.error('同步刪除標籤到 Firebase 失敗:', err);
        }
      })();
    } else if (user && (!favoritesLoaded || !tagsLoaded)) {
      console.log('數據尚未完全載入，暫時跳過刪除標籤同步到 Firebase');
    }
  };

  // 處理AI語音選擇
  const handleSelectAIVoice = (voice: string) => {
    setSelectedAIVoice(voice);
    // 可以考慮存儲到localStorage
    storage.saveAIVoice(voice);
  };

  // 分享導入 modal 處理函數
  const handleShareImportModalClose = () => {
    setShowShareImportModal(false);
    setShareImportData(null);
    setShareImportId('');
    // 從URL中移除hash參數
    const newUrl = window.location.pathname;
    window.history.replaceState({}, document.title, newUrl);
  };

  // Android WebView Modal 確認處理
  const handleAndroidModalConfirm = () => {
    const intentUrl = `intent://${window.location.host}${window.location.pathname}${window.location.search}#Intent;scheme=https;package=com.android.chrome;end;`;
    window.location.href = intentUrl;
  };

  // iOS Facebook Modal 關閉處理
  const handleIOSFacebookModalClose = () => {
    setShowIOSFacebookModal(false);
  };

  // iOS LINE Modal 關閉處理
  const handleIOSLINEModalClose = () => {
    setShowIOSLINEModal(false);
  };

  const handleDirectImport = async () => {
    if (!shareImportData) return;
    
    try {
      setShareImportLoading(true);
      
      // 將分享的句子加入到本地最愛（使用相同的邏輯）
      if (shareImportData.favorites) {
        const shareTexts = shareImportData.favorites.map(fav => fav.text);
        
        // 過濾出需要添加的文本
        const textsToAdd = shareTexts.filter(text => {
          if (!text || !text.trim()) return false;
          const trimmedText = text.trim();
          return !favorites.find(fav => fav.text.trim() === trimmedText);
        });
        
        if (textsToAdd.length === 0) {
          setSystemTip('所有句子都已經在您的收藏中了！');
          setShowShareImportModal(false);
          handleShareImportModalClose();
          return;
        }
        
        // 批量創建新的收藏項目
        const newFavorites: Favorite[] = [];
        let currentNextId = storage.getNextFavoriteId(favorites);
        
        for (let i = 0; i < textsToAdd.length; i++) {
          const trimmedText = textsToAdd[i].trim();
          const newId = currentNextId.toString();
          const newFavorite = {
            id: newId,
            text: trimmedText,
            tagIds: [], // 不指定標籤
            createdAt: Date.now() + i
          };
          
          newFavorites.push(newFavorite);
          currentNextId++;
        }
        
        // 一次性更新狀態
        const updatedFavorites = [...newFavorites, ...favorites];
        setFavorites(updatedFavorites);
        setNextFavoriteId(currentNextId);
        
        // 保存到 localStorage
        storage.saveFavorites(updatedFavorites);
        storage.saveNextFavoriteId(currentNextId);
        
        // 切換到favorites標籤
        setBottomActiveTab('favorites');
        
        // 關閉 modal
        setShowShareImportModal(false);
        
        // 顯示成功訊息
        setSystemTip(`已成功將 ${newFavorites.length} 個句子加入本地收藏！`);
        
        // 清理狀態
        handleShareImportModalClose();
      }
    } catch (err) {
      console.error('直接導入失敗:', err);
      setError(`導入失敗: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setShareImportLoading(false);
    }
  };

    const handleLoginAndImport = async () => {
    try {
      setShareImportLoading(true);
      
      // 檢查是否已經登入
      if (user) {
        // 已經登入，直接導入句子（標記為雲端導入）
        await handleImportToFavorites(true);
      } else {
        // 需要登入
        try {
          await signInWithGoogle();
          
          // 等待登入狀態更新（最多等待3秒）
          let attempts = 0;
          const maxAttempts = 30; // 3秒，每100ms檢查一次
          
          while (!user && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
          }
          
          // 檢查登入是否成功
          if (!user) {
            throw new Error('登入超時或失敗，請重試');
          }
          
          // 登入成功後導入句子（標記為雲端導入）
          await handleImportToFavorites(true);
        } catch (authError) {
          console.error('登入失敗:', authError);
          setError(`登入失敗: ${authError instanceof Error ? authError.message : String(authError)}`);
          return;
        }
      }
    } catch (err) {
      console.error('登入並導入失敗:', err);
      setError(`登入並導入失敗: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setShareImportLoading(false);
    }
  };

  // 輔助函數：將分享的句子導入到我的最愛
  const handleImportToFavorites = async (isCloudImport: boolean = false) => {
    if (shareImportData && shareImportData.favorites) {
      const shareTexts = shareImportData.favorites.map(fav => fav.text);
      
      // 過濾出需要添加的文本
      const textsToAdd = shareTexts.filter(text => {
        if (!text || !text.trim()) return false;
        const trimmedText = text.trim();
        return !favorites.find(fav => fav.text.trim() === trimmedText);
      });
      
      if (textsToAdd.length === 0) {
        setSystemTip('所有句子都已經在您的收藏中了！');
        setShowShareImportModal(false);
        handleShareImportModalClose();
        return;
      }
      
      // 批量創建新的收藏項目
      const newFavorites: Favorite[] = [];
      let currentNextId = storage.getNextFavoriteId(favorites);
      
      for (let i = 0; i < textsToAdd.length; i++) {
        const trimmedText = textsToAdd[i].trim();
        const newId = currentNextId.toString();
        const newFavorite = {
          id: newId,
          text: trimmedText,
          tagIds: [], // 不指定標籤
          createdAt: Date.now() + i
        };
        
        newFavorites.push(newFavorite);
        currentNextId++;
      }
      
      // 一次性更新狀態
      const updatedFavorites = [...newFavorites, ...favorites];
      setFavorites(updatedFavorites);
      setNextFavoriteId(currentNextId);
      
      // 切換到favorites標籤
      setBottomActiveTab('favorites');
      
      // 關閉 modal
      setShowShareImportModal(false);
      
      // 只有在雲端導入（用戶已登入）時才顯示成功訊息
      if (isCloudImport && user) {
        setSystemTip(`已成功將 ${newFavorites.length} 個句子加入我的最愛！`);
      }
      
      // 清理狀態
      handleShareImportModalClose();
    }
  };

  const handleEditCurrentReference = async () => {
    if (!referenceText) return;
    if (!currentFavoriteId) {
      setSystemTip('請先選擇收藏句子');
      setTimeout(() => setSystemTip(null), 2000);
      return;
    }
    const fav = favorites.find(f => f.id === currentFavoriteId);
    if (fav) {
      const updatedFavorites = favorites.map(f =>
        f.id === fav.id ? { ...f, text: referenceText } : f
      );
      setFavorites(updatedFavorites);
      
      // 同步到Firebase（如果用戶已登入）
      if (user && favoritesLoaded && tagsLoaded) {
        try {
          // 更新鏡像以防止監聽器覆蓋
          latestUpdateRef.current.favorites2 = updatedFavorites;
          
          const { saveUserFavorites } = await import('../utils/firebaseStorage');
          await saveUserFavorites(user.uid, updatedFavorites);
          console.log('修改句子已同步到Firebase');
        } catch (err) {
          console.error('同步修改句子到Firebase失敗:', err);
        }
      }
      
      // 不要自動跳回第一句，維持 currentFavoriteId 與 textarea 內容
      setSystemTip('已修改該句子');
      setTimeout(() => setSystemTip(null), 2000);
    } else {
      setSystemTip('該句子不在收藏中');
      setTimeout(() => setSystemTip(null), 2000);
    }
  };

  const handleRemoveCurrentReference = () => {
    if (!referenceText) return;
    if (!currentFavoriteId) {
      setSystemTip('請先選擇收藏句子');
      setTimeout(() => setSystemTip(null), 2000);
      return;
    }
    const fav = favorites.find(f => f.id === currentFavoriteId);
    if (fav) {
      removeFromFavorite(fav.id);
      const idx = filteredFavorites.findIndex(f => f.id === fav.id);
      let nextIdx = (idx + 1) % filteredFavorites.length;
      if (filteredFavorites.length === 1) nextIdx = -1;
      setTimeout(() => {
        if (nextIdx >= 0 && filteredFavorites[nextIdx]) {
          setReferenceText(filteredFavorites[nextIdx].text);
          setCurrentFavoriteId(filteredFavorites[nextIdx].id);
        } else {
          setReferenceText('');
          setCurrentFavoriteId(null);
        }
      }, 100);
      setSystemTip('已刪除該句子');
      setTimeout(() => setSystemTip(null), 2000);
    } else {
      setSystemTip('該句子不在收藏中');
      setTimeout(() => setSystemTip(null), 2000);
    }
  };

  useEffect(() => {
    // 簡化的 filteredFavorites 邏輯：只處理當前 currentFavoriteId 不在篩選結果中的情況
    // console.log('[useEffect:filteredFavorites] currentFavoriteId:', currentFavoriteId, 'filteredFavorites:', filteredFavorites.map(f=>f.id));
    
    if (
      currentFavoriteId !== null &&
      filteredFavorites.length > 0 &&
      !filteredFavorites.some(f => f.id === currentFavoriteId)
    ) {
      console.log('[useEffect:filteredFavorites] currentFavoriteId 不在篩選結果中，使用第一個結果');
      const firstFavorite = filteredFavorites[0];
      setReferenceText(firstFavorite.text);
      setCurrentFavoriteId(firstFavorite.id);
      storage.saveReferenceText(firstFavorite.text);
    }
  }, [filteredFavorites, currentFavoriteId]); // 只依賴篩選結果的變化

  useEffect(() => {
    // 只有登入用戶才存儲 currentFavoriteId 到 localStorage
    console.log('[useEffect:currentFavoriteId] user:', user?.uid, 'currentFavoriteId:', currentFavoriteId);
    if (user && currentFavoriteId) {
      const key = getCurrentFavoriteIdKey(user);
      localStorage.setItem(key, currentFavoriteId);
      console.log('[useEffect:currentFavoriteId] 已存儲到 localStorage, key:', key, 'value:', currentFavoriteId);
    }
  }, [currentFavoriteId, user]);

  // 新增：控制拖放隨機按鈕顯示與位置
  const [waitingForRandomBtnPos, setWaitingForRandomBtnPos] = useState(false);

  // 判斷是否為觸控裝置
  const isTouchDevice = () => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  };

  // 桌機長按三秒產生拖放隨機按鈕
  let randomBtnHoldTimer: NodeJS.Timeout | null = null;
  let randomBtnHoldStart: number | null = null;
  const handleRandomBtnMouseDown = (e: React.MouseEvent) => {
    if (isTouchDevice()) return;
    randomBtnHoldStart = Date.now();
    randomBtnHoldTimer = setTimeout(() => {
      setSystemTip('等待隨機按鈕設定位置');
      setWaitingForRandomBtnPos(true);
    }, 3000);
  };
  const handleRandomBtnMouseUp = (e: React.MouseEvent) => {
    if (isTouchDevice()) return;
    if (randomBtnHoldTimer) clearTimeout(randomBtnHoldTimer);
    if (randomBtnHoldStart && Date.now() - randomBtnHoldStart < 3000) {
      goToRandomSentence();
    }
    setSystemTip(null);
    randomBtnHoldStart = null;
    randomBtnHoldTimer = null;
  };
  // 手機觸控只觸發隨機
  const handleRandomBtnTouchStart = () => {};
  const handleRandomBtnTouchEnd = (e: React.TouchEvent) => {
    goToRandomSentence();
    setSystemTip(null);
  };

  // 畫面點擊決定隨機按鈕位置
  useEffect(() => {
    if (!waitingForRandomBtnPos) return;
    const handleScreenClick = (e: MouseEvent) => {
      setWaitingForRandomBtnPos(false);
      setSystemTip(null);
    };
    const handleScreenTouch = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        setWaitingForRandomBtnPos(false);
        setSystemTip(null);
      }
    };
    window.addEventListener('click', handleScreenClick, true);
    window.addEventListener('touchend', handleScreenTouch, true);
    return () => {
      window.removeEventListener('click', handleScreenClick, true);
      window.removeEventListener('touchend', handleScreenTouch, true);
    };
  }, [waitingForRandomBtnPos]);

  // 全域快捷鍵：numpad enter/enter 觸發隨機或停止錄音，左右箭頭鍵導航（避免輸入框觸發）
  useEffect(() => {
    const isEditableElement = (el: Element | null): boolean => {
      if (!el) return false;
      const tag = (el as HTMLElement).tagName.toLowerCase();
      return tag === 'input' || tag === 'textarea' || (el as HTMLElement).isContentEditable;
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (isEditableElement(e.target as Element) || isEditableElement(activeEl)) {
        return;
      }
      
      if (e.code === 'NumpadEnter' || e.code === 'Enter') {
        if (recorder.recording) {
          stopAssessment();
        } else if (favoritesLoaded) {
          goToRandomSentence();
        }
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        if (recorder.recording) {
          stopAssessment();
        } else if (favoritesLoaded && filteredFavorites.length > 0) {
          // 獲取前一個句子的文本
          const currentIndex = filteredFavorites.findIndex(
            fav => fav.id === currentFavoriteId
          );
          let newIndex;
          if (currentIndex === -1) {
            newIndex = filteredFavorites.length - 1;
          } else {
            newIndex = (currentIndex - 1 + filteredFavorites.length) % filteredFavorites.length;
          }
          const target = filteredFavorites[newIndex];
          if (target) {
            // 先更新狀態
            setReferenceText(target.text);
            setCurrentFavoriteId(target.id);
            storage.saveReferenceText(target.text);
            setHighlightedFavoriteId(target.id);
            // 播放新句子並根據自動練習模式決定是否錄音
            setTimeout(async () => {
              try {
                setIsLoading(true);
                setStreamLoading(true);
                setError(null);
                const result = await azureSpeech.speakWithAIServerStream(target.text, selectedAIVoice, voiceSettings.rate);
                if (isAutoPracticeMode) {
                  handleAutoPracticeAfterSpeak(target.text);
                }
              } catch (error) {
                console.error('播放前一句失敗:', error);
                setError(`播放前一句失敗: ${error instanceof Error ? error.message : String(error)}`);
              } finally {
                setIsLoading(false);
                setStreamLoading(false);
              }
            }, 100);
          }
        }
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        if (recorder.recording) {
          stopAssessment();
        } else if (favoritesLoaded && filteredFavorites.length > 0) {
          // 獲取下一個句子的文本
          const currentIndex = filteredFavorites.findIndex(
            fav => fav.id === currentFavoriteId
          );
          let newIndex;
          if (currentIndex === -1) {
            newIndex = 0;
          } else {
            newIndex = (currentIndex + 1) % filteredFavorites.length;
          }
          const target = filteredFavorites[newIndex];
          if (target) {
            // 先更新狀態
            setReferenceText(target.text);
            setCurrentFavoriteId(target.id);
            storage.saveReferenceText(target.text);
            setHighlightedFavoriteId(target.id);
            // 播放新句子並根據自動練習模式決定是否錄音
            setTimeout(async () => {
              try {
                setIsLoading(true);
                setStreamLoading(true);
                setError(null);
                const result = await azureSpeech.speakWithAIServerStream(target.text, selectedAIVoice, voiceSettings.rate);
                if (isAutoPracticeMode) {
                  handleAutoPracticeAfterSpeak(target.text);
                }
              } catch (error) {
                console.error('播放下一句失敗:', error);
                setError(`播放下一句失敗: ${error instanceof Error ? error.message : String(error)}`);
              } finally {
                setIsLoading(false);
                setStreamLoading(false);
              }
            }, 100);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [recorder.recording, favoritesLoaded, filteredFavorites.length, referenceText, selectedAIVoice, voiceSettings.rate, isAutoPracticeMode]);

  // 全域快捷鍵：空白鍵觸發撥放聲音（避免輸入框觸發）
  useEffect(() => {
    const isEditableElement = (el: Element | null): boolean => {
      if (!el) return false;
      const tag = (el as HTMLElement).tagName.toLowerCase();
      return tag === 'input' || tag === 'textarea' || (el as HTMLElement).isContentEditable;
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput = isEditableElement(e.target as Element) || isEditableElement(activeEl);
      if (!isInput && e.code === 'Space') {
        e.preventDefault();
        if (recorder.recording) {
          stopAssessment();
        } else {
          speakText();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [speakText, recorder.recording, stopAssessment]);

  useEffect(() => {
    console.log('【useEffect:user/loading】user 狀態:', user, 'loading:', userLoading);
  }, [user, userLoading]);

  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);

  // JSX 渲染部分
  return (
    <>
      <div className="pa-container">
        <div className="pa-title">
        <div className="logo-container">
          <img 
            src="/nicetone.webp" 
            alt="NiceTone" 
            className="pa-title-logo" 
            onClick={() => {
              if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                window.location.href = '/';
              } else {
                window.open('https://nicetone.ai', '_blank');
              }
            }}
            style={{ cursor: 'pointer' }}
          />
          <div className="pa-subtitle">
            口袋裡的AI英語教練
          </div>
        </div>
        
        {/* 登入/登出按鈕 */}
        <div className="auth-buttons">
          {user ? (
            <div className="user-info">
              <span className="user-name">{user.displayName || user.email}</span>
              <button 
                onClick={signOutUser}
                className="btn btn-outline auth-btn"
                title="登出"
              >
                <i className="fas fa-sign-out-alt"></i>
                <span>登出</span>
              </button>
            </div>
          ) : (
            <div className="login-buttons-group">
              {!disableGoogle && (
                <button 
                  onClick={async () => {
                    try {
                      await signInWithGoogle();
                    } catch (error: any) {
                      console.error('Google 登入失敗:', error);
                      setError(`Google 登入失敗: ${error.message || '請重試或檢查網路連接'}`);
                    }
                  }}
                  className="btn btn-google auth-btn"
                  title="使用 Google 登入"
                >
                  <i className="fab fa-google"></i>
                  <span>Google</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* 錯誤提示 */}
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}
      
      {/* 主要功能區域 */}
      <div className="pa-main-content">
        {/* 整合输入区域和控制按钮 */}
        <div className="card-section">
          {/* 新增选项卡导航 */}
          <div className="tabs-nav input-tabs">
            <button 
              className={`tab-button ${topActiveTab === 'input' ? 'active' : ''}`}
              onClick={() => handleTabChange('input')}
            >
              發音評分
            </button>
            <button 
              className={`tab-button ${topActiveTab === 'ai' ? 'active' : ''}`}
              onClick={() => handleTabChange('ai')}
            >
              AI造句幫手
              <span 
                data-tooltip-id="ai-helper-tooltip"
                data-tooltip-content="在這裡輸入指令，要求AI造出能幫助你英文能力的句子。例如：請造一些關於旅遊的基礎句子，或者幫我練習過去式動詞的句子。"
                data-tooltip-place="bottom"
                style={{
                  color: 'var(--ios-text-secondary)',
                  marginLeft: '4px',
                  cursor: 'pointer'
                }}
              >
                <i className="fas fa-question-circle" />
              </span>
            </button>
            <Tooltip
              id="ai-helper-tooltip"
              openOnClick
              isOpen={showAITooltip}
              setIsOpen={setShowAITooltip}
              clickable
              style={{
                backgroundColor: 'var(--ios-background-secondary, #f2f2f7)',
                color: 'var(--ios-text-primary, #000000)',
                border: '1px solid var(--ios-border-color, #c6c6c8)',
                borderRadius: '8px',
                padding: '12px 16px',
                fontSize: '14px',
                lineHeight: '1.5',
                maxWidth: '300px',
                whiteSpace: 'normal',
                wordWrap: 'break-word',
                zIndex: 9999,
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
              }}
            />
          </div>
          
          {/* 發音評分 TAB */}
          {topActiveTab === 'input' && (
            <>
              <h3 
            onClick={() => {
              textareaRef.current?.focus();
            }}
            className="clickable-header"
          >
          </h3>
              
              <div className="integrated-input-container" ref={inputContainerRef} tabIndex={0}>
                {/* 文本输入区 */}
                <ResizableTextarea
              ref={textareaRef}
              value={referenceText}
              onChange={handleReferenceTextChange}
              onPaste={handlePaste}
              onFocus={handleTextareaWordUpdate}
              onClick={handleTextareaWordUpdate}
              onSelect={handleTextareaWordUpdate}
              className="textarea-input"
                  fontSize={fontSize}
              placeholder="輸入或粘貼要練習的文本..."
                  storageKey="mainTextareaHeight"
                  defaultHeight={140}
            />
                
                {/* 工具栏控制按钮 */}
                <div className="textarea-toolbar">
                  {/* 字体调整按钮 */}
                  <button 
                    onClick={decreaseFontSize} 
                    className="control-button"
                    title="減小字體"
                  >
                    <i className="fas fa-minus"></i>
                  </button>
                  
                  <span className="font-size-display">{fontSize}</span>
                  
                  <button 
                    onClick={increaseFontSize} 
                    className="control-button"
                    title="增大字體"
                  >
                    <i className="fas fa-plus"></i>
                  </button>
                  
                  {/* 收藏按钮 */}
            <button
              onClick={() => addToFavorites(referenceText)}
              disabled={!referenceText}
              title="新增到收藏"
              className={!referenceText ? "control-button favorite-button-disabled" : "control-button favorite-button-dynamic"}
                  >
                    <i className="fas fa-star"></i>
              </button>
              {/* 修改按鈕 */}
              <button
                onClick={handleEditCurrentReference}
                disabled={!referenceText}
                title="修改這句"
                className={!referenceText ? "control-button favorite-button-disabled" : "control-button favorite-button-dynamic"}
                style={{ marginLeft: 4 }}
              >
                <i className="fas fa-edit"></i>
              </button>
              {/* 刪除按鈕 */}
              <button
                onClick={handleRemoveCurrentReference}
                disabled={!referenceText}
                title="刪除這一句"
                className={!referenceText ? "control-button favorite-button-disabled" : "control-button favorite-button-dynamic"}
                style={{ marginLeft: 4 }}
              >
                <i className="fas fa-trash"></i>
              </button>
              {/* 撥放後自動錄音按鈕 */}
              <button
                onClick={toggleAutoPracticeMode}
                title={isAutoPracticeMode ? "關閉自動練習模式" : "開啟自動練習模式（播放後自動錄音）"}
                className={`control-button auto-practice-btn ${isAutoPracticeMode ? 'auto-practice-active' : 'auto-practice-inactive'}`}
                style={{ marginLeft: 4 }}
              >
                {/* 機器人 LOGO，使用 FontAwesome fa-robot */}
                <i className="fas fa-robot"></i>
              </button>
              {/* 查字典按鈕 */}
              <button
                onClick={openDictionaryAtCaret}
                title="查字典"
                className="control-button"
                style={{ marginLeft: 4 }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M4 4.5A2.5 2.5 0 0 1 6.5 7H20" />
                  <path d="M6.5 7v10" />
                  <rect x="2" y="2" width="20" height="20" rx="2.5" />
                </svg>
              </button>
        </div>
        
                {/* 操作按钮区 */}
                <div className="textarea-action-bar">
                  {/* 第一排：評分和發音按鈕 */}
                  <div className="button-row">
                    {/* 評分按鈕 */}
                    <button
                      onClick={handleAssessmentButtonClick}
                      disabled={(isLoading && !isAssessing && !recorder.recording) || (!isAssessing && !recorder.recording && !referenceText)}
                      className={`btn ${(isAssessing || recorder.recording) && buttonStyleDelayed ? "btn-danger" : "btn-primary"} btn-flex-half`}
                    >
                      <i className="fas fa-microphone mic-icon-margin"></i>
                      {(isAssessing || recorder.recording) && buttonStyleDelayed
                        ? "停止錄音"
                        : isLoading
                        ? "處理中..."
                        : `評分${useBackend ? ' ' : ''}`}
                    </button>
                    
                    {/* 發音按鈕 */}
                    <button
                      onClick={() => {
                        speakText();
                      }}
                      disabled={isLoading || streamLoading || !referenceText}
                      className={`btn btn-success btn-flex-half ${(isLoading || streamLoading || !referenceText) ? 'btn-disabled' : ''}`}
                      title="使用AI語音播放"
                    >
                      <i className={`fas ${!useBackend ? 'fa-broadcast-tower' : 'fa-volume-up'}`}></i>
                    </button>
                  </div>
                  
                  {/* 第二排：導航按鈕 */}
                  <div className="button-row">
                    {/* 前一句按鈕 */}
                    <button
                      onClick={() => {
                        if (filteredFavorites.length > 0) {
                          // 獲取前一個句子的文本
                          const currentIndex = filteredFavorites.findIndex(
                            fav => fav.id === currentFavoriteId
                          );
                          let newIndex;
                          if (currentIndex === -1) {
                            newIndex = filteredFavorites.length - 1;
                          } else {
                            newIndex = (currentIndex - 1 + filteredFavorites.length) % filteredFavorites.length;
                          }
                          const target = filteredFavorites[newIndex];
                          if (target) {
                            // 先更新狀態
                            setReferenceText(target.text);
                            setCurrentFavoriteId(target.id);
                            storage.saveReferenceText(target.text);
                            setHighlightedFavoriteId(target.id);
                            // 播放新句子並根據自動練習模式決定是否錄音
                            setTimeout(async () => {
                              try {
                                setIsLoading(true);
                                setStreamLoading(true);
                                setError(null);
                                const result = await azureSpeech.speakWithAIServerStream(target.text, selectedAIVoice, voiceSettings.rate);
                                if (isAutoPracticeMode) {
                                  handleAutoPracticeAfterSpeak(target.text);
                                }
                              } catch (error) {
                                console.error('播放前一句失敗:', error);
                                setError(`播放前一句失敗: ${error instanceof Error ? error.message : String(error)}`);
                              } finally {
                                setIsLoading(false);
                                setStreamLoading(false);
                              }
                            }, 100);
                          }
                        }
                      }}
                      disabled={filteredFavorites.length === 0}
                      className={`btn btn-nav btn-flex-third ${filteredFavorites.length === 0 ? 'btn-disabled' : ''}`}
                      title="上一個收藏句子"
                    >
                      <i className="fas fa-chevron-left"></i>
                    </button>
                    
                    {/* 隨機按鈕 */}
                    <button
                      onClick={goToRandomSentence}
                      disabled={filteredFavorites.length === 0 || isLoading || streamLoading}
                      className={`btn btn-nav btn-flex-third ${(filteredFavorites.length === 0 || isLoading || streamLoading) ? 'btn-disabled' : ''}`}
                      title="隨機選擇並播放收藏句子"
                    >
                      <i className="fas fa-random"></i>
                    </button>
                    
                    {/* 下一句按鈕 */}
                    <button
                      onClick={() => {
                        if (filteredFavorites.length > 0) {
                          // 獲取下一個句子的文本
                          const currentIndex = filteredFavorites.findIndex(
                            fav => fav.id === currentFavoriteId
                          );
                          let newIndex;
                          if (currentIndex === -1) {
                            newIndex = 0;
                          } else {
                            newIndex = (currentIndex + 1) % filteredFavorites.length;
                          }
                          const target = filteredFavorites[newIndex];
                          if (target) {
                            // 先更新狀態
                            setReferenceText(target.text);
                            setCurrentFavoriteId(target.id);
                            storage.saveReferenceText(target.text);
                            setHighlightedFavoriteId(target.id);
                            // 播放新句子並根據自動練習模式決定是否錄音
                            setTimeout(async () => {
                              try {
                                setIsLoading(true);
                                setStreamLoading(true);
                                setError(null);
                                const result = await azureSpeech.speakWithAIServerStream(target.text, selectedAIVoice, voiceSettings.rate);
                                if (isAutoPracticeMode) {
                                  handleAutoPracticeAfterSpeak(target.text);
                                }
                              } catch (error) {
                                console.error('播放下一句失敗:', error);
                                setError(`播放下一句失敗: ${error instanceof Error ? error.message : String(error)}`);
                              } finally {
                                setIsLoading(false);
                                setStreamLoading(false);
                              }
                            }, 100);
                          }
                        }
                      }}
                      disabled={filteredFavorites.length === 0}
                      className={`btn btn-nav btn-flex-third ${filteredFavorites.length === 0 ? 'btn-disabled' : ''}`}
                      title="下一個收藏句子"
                    >
                      <i className="fas fa-chevron-right"></i>
                    </button>
                  </div>
                </div>
            
            {isAssessing && <div className="recording-indicator">錄音中... (最長30秒)</div>}
            
            {isLoading && <div className="loading-indicator">處理中...</div>}
            
            {/* 新增streaming進度指示器 */}
            {useBackend && backendSpeech.isStreaming && (
              <div className="streaming-indicator">
                流式處理中... ({backendSpeech.streamProgress}%)
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${backendSpeech.streamProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
            
            {streamLoading && <div className="loading-indicator stream-loading">流式處理中...</div>}
            
            {cacheTipVisible && <div className="cache-tip">使用已緩存的語音</div>}
          </div>
            </>
          )}
          
          {/* AI助理 TAB */}
          {topActiveTab === 'ai' && (
            <AIDataProcessor
              favorites={favorites}
              tags={tags}
              historyRecords={historyRecords}
              onUpdateFavorites={setFavorites}
              onUpdateTags={setTags}
              onUpdateHistoryRecords={setHistoryRecords}
              aiResponse={aiResponse}
              setAiResponse={setAiResponse}
              onAIResponseReceived={handleAIResponseReceived}
              addToFavorites={addToFavorites}
              initialPrompt={aiPromptFromURL}
              user={user}
              onLoginRequired={(actionName, message) => {
                setLoginModalAction(actionName);
                setLoginModalMessage(message || '');
                setShowLoginModal(true);
              }}
            />
          )}
        </div>
        
        {/* 結果顯示區域 */}
        {result && (() => {
          try {
            // Azure 直連或後端含 NBest
            const nbestArray = result.NBest || result.nBest || result.nbest;
            if (Array.isArray(nbestArray) && nbestArray.length > 0) {
              const nbest = nbestArray[0];
              const pa = (nbest as any).pronunciationAssessment || nbest.PronunciationAssessment || {};
              const words = nbest.Words || (nbest as any).words || [];
              return (
                <div className="card-section">
                  <h3 className="section-header special-title">總分</h3>
                  <ScoreBar label="準確度" value={pa.AccuracyScore ?? pa.accuracyScore ?? 0} />
                  <ScoreBar label="流暢度" value={pa.FluencyScore ?? pa.fluencyScore ?? 0} />
                  <ScoreBar label="完整度" value={pa.CompletenessScore ?? pa.completenessScore ?? 0} />
                  <ScoreBar label="發音" value={pa.PronScore ?? pa.pronScore ?? result.pronunciationScore ?? 0} />
                  <h3 className="section-header special-title">句子分析</h3>
                  {words.length > 0 ? (
                    <WordsDisplay words={words} />
                  ) : (
                    <p>無法獲取詳細單詞評分數據</p>
                  )}
                  <h4 className="section-header special-title">識別文本</h4>
                  <p className="recognized-text">
                    {nbest.Display || nbest.display || result.DisplayText || result.text || "--"}
                  </p>
                </div>
              );
            }

            // 後端扁平化結果 (無 NBest)
            return (
              <div className="card-section">
                <h3 className="section-header special-title">評分結果</h3>
                <ScoreBar label="準確度" value={result.accuracyScore || 0} />
                <ScoreBar label="流暢度" value={result.fluencyScore || 0} />
                <ScoreBar label="完整度" value={result.completenessScore || 0} />
                <ScoreBar label="發音" value={result.pronunciationScore || 0} />
              </div>
            );
          } catch (err) {
            console.error('解析評分資料失敗', err);
            return null;
          }
        })()}
        
        
        {/* 標籤頁導航區域 */}
        <div className="card-section">
          <div className="tabs-container">
            <div className="tabs-nav">
              <button 
                className={`tab-button ${bottomActiveTab === 'favorites' ? 'active' : ''}`}
                onClick={() => handleTabChange('favorites')}
              >
                我的最愛
              </button>
              <button 
                className={`tab-button ${bottomActiveTab === 'history' ? 'active' : ''}`}
                onClick={() => handleTabChange('history')}
              >
                發音歷史
              </button>
              {/* 移除管理標籤按鈕 - 標籤管理已整合到我的最愛中 */}
              <button 
                className={`tab-button ${bottomActiveTab === 'voices' ? 'active' : ''}`}
                onClick={() => handleTabChange('voices')}
              >
                選擇語音
              </button>
            </div>
            
            <div className="tab-content">
              {/* 收藏列表標籤頁 */}
              {bottomActiveTab === 'favorites' && (
                <FavoriteList
                  favorites={favorites}
                  tags={tags}
                  selectedTags={selectedTags}
                  onLoadFavorite={loadFavorite}
                  onRemoveFavorite={removeFromFavorite}
                  onToggleTag={toggleTagOnFavorite}
                  onToggleTagSelection={toggleTagSelection}
                  onClearTagSelection={clearTagSelection}
                  onAddFavorite={addToFavorites}
                  onManageTags={() => {}} // 不再需要跳轉到獨立的標籤管理頁面
                  currentText={referenceText}
                  lastAddedFavoriteId={lastAddedFavoriteId}
                  highlightedFavoriteId={highlightedFavoriteId}
                  user={user}
                  onLoginRequired={(actionName, message) => {
                    setLoginModalAction(actionName);
                    setLoginModalMessage(message || '');
                    setShowLoginModal(true);
                  }}
                  onAddTag={addTag}
                  onEditTag={editTag}
                  onDeleteTag={deleteTag}
                  onDataImported={handleDataImported}
                  setFavorites={setFavorites}
                />
              )}
              
              {/* 歷史記錄標籤頁 */}
              {bottomActiveTab === 'history' && (
                <HistoryRecord
                  historyRecords={historyRecords}
                  onDeleteRecord={handleDeleteHistoryRecord}
                  onClearRecords={handleClearHistoryRecords}
                  onLoadText={handleLoadHistoryText}
                  isExpanded={true} // 標籤頁模式下始終展開
                  onToggleExpand={() => {}} // 標籤頁模式下不需要切換展開狀態
                />
              )}
              
              {/* 移除標籤管理標籤頁 - 標籤管理已整合到我的最愛中 */}
              
              {/* 語音選擇標籤頁 */}
              {bottomActiveTab === 'voices' && (
                <VoicePicker 
                  rate={voiceSettings.rate}
                  onRateChange={handleSpeechRateChange}
                  selectedAIVoice={selectedAIVoice}
                  onSelectAIVoice={handleSelectAIVoice}
                />
              )}
              

            </div>
          </div>
        </div>
        
        {/* 渐变动画效果 */}
        {fadeEffect && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
            zIndex: 1000,
            animation: 'fadeInOut 0.5s ease-in-out',
            pointerEvents: 'none'
          }} />
        )}
        
        {/* 新增动画样式 */}
        <style>
          {`
            @keyframes fadeInOut {
              0% { opacity: 0; }
              50% { opacity: 0.5; }
              100% { opacity: 0; }
            }
            
            @keyframes highlightFavorite {
              0% { background: rgba(255, 159, 10, 0.3); }
              70% { background: rgba(255, 159, 10, 0.15); }
              100% { background: rgba(44, 44, 48, 0.5); }
            }
            
            .stream-loading {
              background-color: rgba(0, 122, 255, 0.2);
              color: rgba(0, 122, 255, 1);
            }
            
            .streaming-indicator {
              background-color: rgba(52, 199, 89, 0.1);
              color: rgba(52, 199, 89, 1);
              padding: 8px 12px;
              border-radius: 8px;
              margin: 8px 0;
              font-size: 14px;
              border: 1px solid rgba(52, 199, 89, 0.3);
            }
            
            .progress-bar {
              width: 100%;
              height: 6px;
              background-color: rgba(52, 199, 89, 0.2);
              border-radius: 3px;
              margin-top: 4px;
              overflow: hidden;
            }
            
            .progress-fill {
              height: 100%;
              background-color: rgba(52, 199, 89, 0.8);
              border-radius: 3px;
              transition: width 0.3s ease;
            }
            
            .cache-tip {
              position: fixed;
              bottom: 30px;
              left: 50%;
              transform: translateX(-50%);
              background-color: rgba(52, 199, 89, 0.9);
              color: white;
              padding: 8px 16px;
              border-radius: 20px;
              font-size: 14px;
              z-index: 1000;
              animation: fadeIn 0.3s, fadeOut 0.5s 1s forwards;
            }
            
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            
            @keyframes fadeOut {
              from { opacity: 1; }
              to { opacity: 0; }
            }
            
            @keyframes slideInRight {
              from {
                transform: translateX(100%);
                opacity: 0;
              }
              to {
                transform: translateX(0);
                opacity: 1;
              }
            }
          `}
        </style>
        
        {/* Azure 設定面板 */}
        {showAzureSettings && (
          <div className="azure-settings-container">
            <div className="azure-settings-content">
              <h3 className="azure-settings-title">工程模式(看不懂可以按取消)</h3>
              <div className="azure-settings-form">
                <div className="form-group">
                  <label className="form-label">Speech Key：</label>
                  <input
                    type="text"
                    value={azureSettings.key}
                    onChange={e => setAzureSettings({ ...azureSettings, key: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Region：</label>
                  <input
                    type="text"
                    value={azureSettings.region}
                    onChange={e => setAzureSettings({ ...azureSettings, region: e.target.value })}
                    placeholder="e.g. japaneast"
                    className="form-input"
                  />
                </div>
                <div className="form-actions">
                  <button
                    onClick={() => setShowAzureSettings(false)}
                    className="form-button"
                  >
                    取消
                  </button>
                  <button
                    onClick={saveAzureSettings}
                    className="form-button form-button-primary"
                  >
                    保存
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 登入提示 Modal */}
        <LoginModal
          isOpen={showLoginModal}
          onClose={handleLoginModalClose}
          onGoogleLogin={handleLoginFromModal}
          message={loginModalMessage}
          actionName={loginModalAction}
        />

        {/* iOS Facebook 操作提示 Tooltip */}
        {showFacebookTooltip && (
          <div style={{
            position: 'fixed',
            bottom: '80px',
            right: '20px',
            backgroundColor: '#ff9500',
            color: 'white',
            padding: '12px 16px',
            borderRadius: '12px',
            fontSize: '14px',
            lineHeight: '1.4',
            maxWidth: '280px',
            zIndex: 10000,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            animation: 'slideInRight 0.3s ease-out'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
              🔍 Facebook 登入提示
            </div>
            <div>
              請點擊右下角的<strong>三個橫點按鈕（⋯）</strong>，選擇「在瀏覽器中開啟」或「在 Safari 中開啟」來進行 Google 登入。
            </div>
          </div>
        )}

        <AndroidChromeModal
          isOpen={showAndroidModal}
          onConfirm={handleAndroidModalConfirm}
        />

        {/* iOS Facebook Modal */}
        <IOSFacebookModal
          isOpen={showIOSFacebookModal}
          onClose={handleIOSFacebookModalClose}
        />

        {/* iOS LINE Modal */}
        <IOSLINEModal
          isOpen={showIOSLINEModal}
          onClose={handleIOSLINEModalClose}
        />

        {/* 系統提醒顯示 */}
        {systemTip && <div className="shake-tip">{systemTip}</div>}

        {/* 字典 Modal（用 Portal 保證永遠在最上層） */}
        {showDictModal && ReactDOM.createPortal(
          <div className="login-modal-overlay" style={{ zIndex: 99999, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }} onClick={() => setShowDictModal(false)}>
            <div className="login-modal-content" style={{ zIndex: 99999, width: 420, maxWidth: '90vw', height: 600, maxHeight: '90vh', padding: 0, position: 'relative', margin: 'auto', top: 0, left: 0, right: 0, bottom: 0 }} onClick={e => e.stopPropagation()}>
              <button className="login-modal-close" style={{ position: 'absolute', top: 8, right: 8, zIndex: 100000 }} onClick={() => setShowDictModal(false)}>
                <i className="fas fa-times"></i>
              </button>
              <iframe
                src={`https://mobile.youdao.com/dict?le=eng&q=${encodeURIComponent(dictWord)}`}
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0, borderRadius: 12, minHeight: 580 }}
                title="Youdao Dictionary"
              />
            </div>
          </div>,
          document.body
        )}

      </div>
      {/* 新增：控制拖放隨機按鈕顯示與位置 */}
      {/* 刪除所有包含 DraggableRandom 的註釋 */}
      {/* ... existing code ... */}
    </div>
    
    {/* 分享導入 Modal - 移到最外層避免受到任何容器樣式影響 */}
    <ShareImportModal
      isOpen={showShareImportModal}
      onClose={handleShareImportModalClose}
      onDirectImport={handleDirectImport}
      onLoginAndImport={handleLoginAndImport}
      isLoading={shareImportLoading}
      shareId={shareImportId}
      previewData={shareImportData ? {
        favorites: shareImportData.favorites || [],
        tags: shareImportData.tags || []
      } : undefined}
    />
    </>
  );
};

export default PronunciationAssessment; 