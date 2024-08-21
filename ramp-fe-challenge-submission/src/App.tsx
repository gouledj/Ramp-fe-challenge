import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { Employee } from "./utils/types"
import { InputSelect } from "./components/InputSelect"
import { TransactionPane } from "./components/TransactionPane"
import { Instructions } from "./components/Instructions"
import { useEmployees } from "./hooks/useEmployees"
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions"
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee"
import { EMPTY_EMPLOYEE } from "./utils/constants"

let maxPage: number | null | undefined = undefined;

export function App() {
  const { data: employees, ...employeeUtils } = useEmployees()
  const { data: paginatedTransactions, ...paginatedTransactionsUtils } = usePaginatedTransactions()
  const { data: transactionsByEmployee, ...transactionsByEmployeeUtils } = useTransactionsByEmployee()
  const [isLoading, setIsLoading] = useState(false)

  const transactions = useMemo(
    () => paginatedTransactions?.data ?? transactionsByEmployee ?? null,
    [paginatedTransactions, transactionsByEmployee]
  )

  const loadAllTransactions = useCallback(async () => {
    setIsLoading(true)
    const tempPage = paginatedTransactions?.nextPage;
    await employeeUtils.fetchAll()
    await paginatedTransactionsUtils.fetchAll()
    if(tempPage === paginatedTransactions?.nextPage) {
      if(paginatedTransactions !== null && paginatedTransactions.nextPage !== null) {
        maxPage = paginatedTransactions.nextPage;
      }
    }

    setIsLoading(false)
  }, [employeeUtils, paginatedTransactionsUtils, transactionsByEmployeeUtils])

  const loadTransactionsByEmployee = useCallback(
    async (employeeId: string) => {
      maxPage = 0;
      paginatedTransactionsUtils.invalidateData()
      await transactionsByEmployeeUtils.fetchById(employeeId || 'all-employees')
    },
    [paginatedTransactionsUtils, transactionsByEmployeeUtils]
  )

  useEffect(() => {
    if (employees === null && !employeeUtils.loading) {
      loadAllTransactions()
    }
  }, [employeeUtils.loading, employees, loadAllTransactions])

  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />

        <hr className="RampBreak--l" />

        <InputSelect<Employee>
          isLoading={isLoading}
          defaultValue={EMPTY_EMPLOYEE}
          items={employees === null ? [] : [EMPTY_EMPLOYEE, ...employees]}
          label="Filter by employee"
          loadingLabel="Loading employees"
          parseItem={(item) => ({
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          })}
          onChange={async (newValue) => {
            if (newValue === null) {
              return
            }

            await loadTransactionsByEmployee(newValue.id)
          }}
        />

        <div className="RampBreak--l" />

        <div className="RampGrid">
          {transactions === null ? (
            <div className="RampLoading--container">Loading...</div>
          ) : (
            <Fragment>
              <div data-testid="transaction-container">
                {transactions.map((transaction) => (
                  <TransactionPane key={transaction.id} transaction={transaction} />
                ))}
              </div>
              {(transactionsByEmployee === null || paginatedTransactions !== null || transactionsByEmployee.length === 0) && paginatedTransactions?.nextPage !== maxPage ? <button
                  className="RampButton"
                  disabled={paginatedTransactionsUtils.loading}
                  onClick={async () => {
                    await loadAllTransactions()
                  }}
              >
                View More
              </button> : null}
            </Fragment>
          )}
        </div>
      </main>
    </Fragment>
  )
}
