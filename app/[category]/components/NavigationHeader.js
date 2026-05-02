'use client';

import React, { memo } from 'react';
import styles from '../page.module.css';

/**
 * NavigationHeader Component
 * Handles folder history navigation and the category/folder title.
 */
const NavigationHeader = ({ 
  selectedFolderId, 
  resetToRoot, 
  goBack, 
  goForward, 
  historyPointer, 
  historyStack, 
  currentFolder, 
  info 
}) => {
  return (
    <div className={styles.pageHeader}>
      <div className={styles.navActions}>
        <button 
          className={styles.navBtn} 
          onClick={resetToRoot} 
          title="Home Root"
          disabled={selectedFolderId === null}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </button>
        <div className={styles.navArrows}>
          <button 
            className={styles.navBtn} 
            onClick={goBack} 
            disabled={historyPointer <= 0}
            title="Back"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </button>
          <button 
            className={styles.navBtn} 
            onClick={goForward} 
            disabled={historyPointer >= historyStack.length - 1}
            title="Forward"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </button>
        </div>
      </div>
      
      <span className={styles.headerSep}>|</span>

      <h1 className={styles.title} style={{ color: info.color }}>
        {currentFolder ? currentFolder.name : info.name}
      </h1>
    </div>
  );
};

export default memo(NavigationHeader);
