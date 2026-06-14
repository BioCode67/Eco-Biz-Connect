// 당겨서 새로고침 공용 훅 — load 함수를 받아 RefreshControl 상태를 관리한다.
import { useCallback, useState } from "react";

export function useRefresh(load: () => Promise<unknown>) {
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);
  return { refreshing, onRefresh };
}
