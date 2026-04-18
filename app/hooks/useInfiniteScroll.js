import { useEffect, useCallback, useRef } from "react";

/**
 * Custom hook to handle infinite scrolling using IntersectionObserver.
 * @param {boolean} hasMore - Whether there are more items to load.
 * @param {boolean} isLoading - Whether a load is currently in progress.
 * @param {Function} fetchNextPage - The function to call to fetch more items.
 * @returns {React.RefObject} - The ref to attach to the target element.
 */
export function useInfiniteScroll(hasMore, isLoading, fetchNextPage) {
  const observerRef = useRef();

  const lastElementRef = useCallback(
    (node) => {
      if (isLoading) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          fetchNextPage();
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [isLoading, hasMore, fetchNextPage]
  );

  useEffect(() => {
    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, []);

  return lastElementRef;
}
