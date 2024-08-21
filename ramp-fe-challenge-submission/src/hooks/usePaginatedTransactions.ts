import { useCallback, useState } from "react"
import { PaginatedRequestParams, PaginatedResponse, Transaction } from "../utils/types"
import { PaginatedTransactionsResult } from "./types"
import { useCustomFetch } from "./useCustomFetch"
import { useWrappedRequest } from "./useWrappedRequest"

export function usePaginatedTransactions(): PaginatedTransactionsResult {
  const { customFetch } = useCustomFetch()
  const { loading, wrappedRequest } = useWrappedRequest()
  const [paginatedTransactions, setPaginatedTransactions] = useState<PaginatedResponse<
    Transaction[]
  > | null>(null)

  const fetchAll = useCallback(
    () =>
      wrappedRequest(async () => {

          const response = await customFetch<PaginatedResponse<Transaction[]>, PaginatedRequestParams>(
              "paginatedTransactions",
              {
                  page: paginatedTransactions === null ? 0 : paginatedTransactions.nextPage,
              }
          ) || null;

        setPaginatedTransactions((previousResponse) => {

          if (previousResponse === null) {
            return response
          }

            const sameLastData = (arr1: string | any[], arr2: string | any[]) => {
              if(arr1[arr1.length-1].id == arr2[arr2.length-1].id) return true;
              return false;
            }

          if(previousResponse.nextPage === response.nextPage && sameLastData(previousResponse.data,response.data)) {
              return {data: [...previousResponse.data], nextPage: previousResponse.nextPage}
          } else {
              return {data: [...previousResponse.data, ...response.data], nextPage: response.nextPage}
          }

        })
      }),
    [customFetch, paginatedTransactions, wrappedRequest]
  )

  const invalidateData = useCallback(() => {
    setPaginatedTransactions(null)
  }, [])

  return { data: paginatedTransactions, loading, fetchAll, invalidateData }
}
