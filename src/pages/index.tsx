import { type NextPage } from "next";
import Head from "next/head";
import { signIn, signOut, useSession } from "next-auth/react";

import { api } from "~/utils/api";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";

import type {
  ColumnDef,
  PaginationState,
  RowData,
} from "@tanstack/react-table";

import { useCallback, useEffect, useRef, useState } from "react";

declare module "@tanstack/react-table" {
  interface TableMeta<TData extends RowData> {
    updateData: (rowIndex: number, columnId: string, value: unknown) => void;
  }
}

function useSkipper() {
  const shouldSkipRef = useRef(true);
  const shouldSkip = shouldSkipRef.current;

  // Wrap a function with this to skip a pagination reset temporarily
  const skip = useCallback(() => {
    shouldSkipRef.current = false;
  }, []);

  useEffect(() => {
    shouldSkipRef.current = true;
  });

  return [shouldSkip, skip] as const;
}

// Theme: #f1f7ed #243e36 #7ca982 #e0eec6 #c2a83e

type TableData = {
  item: string;
  odds: string;
  stake: number;
  altOdds: string;
  pnl: number;
};

const Home: NextPage = () => {
  const { data: sessionData } = useSession();

  if (process.env.NODE_ENV == "production" && !sessionData) {
    return <LoggedOut />;
  }

  return (
    <>
      <Head>
        <title>Victor: Play to Win</title>
        <meta name="description" content="Odds Calculator" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex max-h-screen min-h-screen flex-col bg-red-500">
        <nav className="min-w-screen sticky top-0 flex flex-row items-center justify-end bg-[#7ca982] p-2 shadow">
          <span className="w-full font-bold">Victor</span>
          <span className="justify-self-end px-2 text-white">
            {sessionData?.user.name}
          </span>
          <button
            className="min-w-max justify-self-end px-2 hover:underline"
            onClick={() => void signOut()}
          >
            Sign Out
          </button>
        </nav>
        <main className="flex h-screen flex-col items-center justify-center bg-gradient-to-b from-[#243e36] to-[#c2a83e]">
          <Table />
        </main>
      </div>
    </>
  );
};

export default Home;

const LoggedOut: React.FC = () => {
  return (
    <>
      <Head>
        <title>Victor: Play to Win</title>
        <meta name="description" content="Odds Calculator" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex max-h-screen min-h-screen flex-col bg-red-500">
        <main className="flex h-screen flex-col items-center justify-center bg-gradient-to-b from-[#243e36] to-[#c2a83e]">
          <p className="font-lg text-5xl font-extrabold text-[#e0eec6] sm:text-[5rem]">
            Victor
          </p>
          <AuthShowcase />
        </main>
      </div>
    </>
  );
};

const AuthShowcase: React.FC = () => {
  const { data: sessionData } = useSession();

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <h1 className="text-center text-white">
        {sessionData && <span>Logged in as {sessionData.user?.name}</span>}
      </h1>
      <button
        className="rounded-full bg-white/10 px-10 py-3 font-semibold text-white no-underline transition hover:bg-white/20"
        onClick={sessionData ? () => void signOut() : () => void signIn()}
      >
        {sessionData ? "Sign out" : "Sign in"}
      </button>
    </div>
  );
};

const Table: React.FC = () => {
  const { data: sessionData } = useSession();

  const { data: savedTable } = api.database.getSavedTable.useQuery(undefined, {
    enabled: sessionData?.user !== undefined,
  });

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  // Give our default column cell renderer editing superpowers!
  const defaultColumn: Partial<ColumnDef<TableData>> = {
    cell: function Cell({ getValue, row: { index }, column: { id }, table }) {
      const initialValue = getValue();
      // We need to keep and update the state of the cell normally
      const [value, setValue] = useState(initialValue);

      // When the input is blurred, we'll call our table meta's updateData function
      const onBlur = () => {
        table.options.meta?.updateData(index, id, value);
      };

      // If the initialValue is changed external, sync it up with our state
      useEffect(() => {
        setValue(initialValue);
      }, [initialValue]);

      if (id != "pnl") {
        return (
          <input
            type="text"
            className="w-full bg-[#e0eec6] text-center"
            value={value as string}
            onChange={(e) => setValue(e.target.value)}
            onBlur={onBlur}
          />
        );
      }
      return (value as number).toFixed(2);
    },
  };

  const columnHelper = createColumnHelper<TableData>();

  const parseAmericanPositive = (odds: string): number => {
    const split = odds.split("+");
    if (split[1] !== undefined) {
      const positive = parseFloat(split[1]);
      if (Number.isNaN(positive)) {
        console.error(
          `Could not calculate implied probability from positive American odds, ${odds}`
        );
        return -1;
      }
      const decimalOdds = positive / 100 + 1;
      return decimalOdds;
    } else {
      console.error(
        `Could not calculate implied probability from positive American odds, ${odds}`
      );
      return -1;
    }
  };

  const parseAmericanNegative = (odds: string): number => {
    const split = odds.split("-");
    if (split[1] !== undefined) {
      const negative = parseFloat(split[1]);
      if (Number.isNaN(negative)) {
        console.error(
          `Could not calculate implied probability from negative American odds, ${odds}`
        );
        return -1;
      }
      const decimalOdds = 100 / negative + 1;
      return decimalOdds;
    } else {
      console.error(
        `Could not calculate implied probability from negative American odds, ${odds}`
      );
      return -1;
    }
  };

  const parseFractional = (odds: string): number => {
    const [nominator, denominator]: number[] = odds
      .split("/")
      .map((value) => parseFloat(value));
    if (
      nominator === undefined ||
      denominator === undefined ||
      Number.isNaN(nominator) ||
      Number.isNaN(denominator)
    ) {
      console.error(
        `Could not calculate implied probability from fractional odds, ${odds}`
      );
      return -1;
    } else {
      const decimalOdds = nominator / denominator + 1;
      return decimalOdds;
    }
  };

  const parseDecimal = (odds: string): number => {
    const decimalOdds = parseFloat(odds);
    if (Number.isNaN(decimalOdds)) {
      console.error(`Could not parse decimal odds, ${odds}`);
      return -1;
    }
    return decimalOdds;
  };

  const parseOdds = (odds: string): number => {
    let decimalOdds = 0;
    if (odds.includes("/")) {
      decimalOdds = parseFractional(odds);
    } else if (odds.includes("+")) {
      decimalOdds = parseAmericanPositive(odds);
    } else if (odds.includes("-")) {
      decimalOdds = parseAmericanNegative(odds);
    } else {
      decimalOdds = parseDecimal(odds);
    }
    return decimalOdds;
  };

  const getExpectedReturn = (row: TableData): number => {
    const decimalOdds = parseOdds(row.odds);
    const altOdds = row.altOdds === "" ? 0 : parseOdds(row.altOdds);

    const margin = row.altOdds === "" ? 0 : 1 / decimalOdds + 1 / altOdds - 1;
    const impliedProbability = 1 / decimalOdds;
    const adjustedProbability = impliedProbability - margin / 2;
    const payoutExclStake = decimalOdds * row.stake - row.stake;

    /*
    console.table({
      decimalOdds,
      altOdds,
      margin,
      impliedProbability,
      adjustedProbability,
      payoutExclStake,
    });
       */

    return (
      payoutExclStake * adjustedProbability -
      row.stake * (1 - adjustedProbability)
    );
  };

  const columns = [
    columnHelper.group({
      header: "Bets",
      footer: (props) => props.column.id,
      columns: [
        columnHelper.accessor("item", {
          header: () => "Item",
          footer: (props) => props.column.id,
        }),
        columnHelper.accessor("odds", {
          header: () => "Odds",
          footer: (props) => props.column.id,
        }),
        columnHelper.accessor("altOdds", {
          header: () => "Alternate Odds",
          footer: (props) => props.column.id,
        }),
        columnHelper.accessor("stake", {
          header: () => "Stake",
          footer: (props) => props.column.id,
        }),
        columnHelper.accessor((row) => getExpectedReturn(row), {
          id: "pnl",
          header: () => "Expected Return",
        }),
      ],
    }),
  ];

  const [data, setData] = useState([
    {
      item: "LIV-EVE",
      odds: "3/1",
      stake: 10,
      altOdds: "4/1",
      pnl: 0,
    },
    {
      item: "MCI v MUN",
      odds: "2/1",
      stake: 15,
      altOdds: "3/1",
      pnl: 0,
    },
    {
      item: "HAM to win Silverstone",
      odds: "13/1",
      stake: 5,
      altOdds: "15/1",
      pnl: 0,
    },
  ]);

  const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper();

  const table = useReactTable({
    data: data,
    columns: columns,
    defaultColumn: defaultColumn,
    getCoreRowModel: getCoreRowModel(),
    state: {
      pagination,
    },
    onPaginationChange: setPagination,
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex,
    meta: {
      updateData: (rowIndex, columnId, value) => {
        // Skip page index reset until after next rerender
        skipAutoResetPageIndex();
        setData((old) =>
          old.map((row, index) => {
            if (index === rowIndex) {
              return {
                ...old[rowIndex]!,
                [columnId]: value,
              };
            }
            return row;
          })
        );
      },
    },
    debugAll: false,
  });

  return (
    <div>
      <table className="w-full">
        <thead className="border bg-[#c2a83e]">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr className="border" key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <th
                    className="border"
                    key={header.id}
                    colSpan={header.colSpan}
                  >
                    {header.isPlaceholder ? null : (
                      <div>
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </div>
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody className="border bg-[#e0eec6]">
          {table.getRowModel().rows.map((row) => {
            return (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => {
                  {
                    /* console.log(cell); */
                  }
                  return (
                    <td
                      tabIndex={0}
                      className="border border-[#f1f7ed] text-center"
                      key={cell.id}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="h-2" />
      <div className="flex items-center gap-2">
        <button
          className="rounded border p-1"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
        >
          {"<<"}
        </button>
        <button
          className="rounded border p-1"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          {"<"}
        </button>
        <button
          className="rounded border p-1"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          {">"}
        </button>
        <button
          className="rounded border p-1"
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
        >
          {">>"}
        </button>
        <span className="flex items-center gap-1">
          <div>Page</div>
          <strong>
            {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </strong>
        </span>
        <span className="flex items-center gap-1">
          | Go to page:
          <input
            type="number"
            defaultValue={table.getState().pagination.pageIndex + 1}
            onChange={(e) => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0;
              table.setPageIndex(page);
            }}
            className="w-16 rounded border p-1"
          />
        </span>
        <select
          value={table.getState().pagination.pageSize}
          onChange={(e) => {
            table.setPageSize(Number(e.target.value));
          }}
        >
          {[10, 20, 30, 40, 50].map((pageSize) => (
            <option key={pageSize} value={pageSize}>
              Show {pageSize}
            </option>
          ))}
        </select>
      </div>
      <div>{table.getRowModel().rows.length} Rows</div>
      <hr />
    </div>
  );
};
