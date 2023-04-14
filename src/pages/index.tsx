import { type NextPage } from "next";
import Head from "next/head";
import { signIn, signOut, useSession } from "next-auth/react";

import { api } from "~/utils/api";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  PaginationState,
  useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";

// Theme: #f1f7ed #243e36 #7ca982 #e0eec6 #c2a83e

const Home: NextPage = () => {
  const { data: sessionData } = useSession();

  const { data: savedTable } = api.database.getSavedTable.useQuery(undefined, {
    enabled: sessionData?.user !== undefined,
  });

  type TableData = {
    item: string;
    odds: string;
    stake: number;
  };

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const columnHelper = createColumnHelper<TableData>();

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
        columnHelper.accessor("stake", {
          header: () => "Stake",
          footer: (props) => props.column.id,
        }),
      ],
    }),
  ];

  const defaultData: TableData[] = [
    {
      item: "LIV-EVE",
      odds: "3/1",
      stake: 10,
    },
    {
      item: "MCI v MUN",
      odds: "2/1",
      stake: 15,
    },
    {
      item: "HAM to win Silverstone",
      odds: "13/1",
      stake: 5,
    },
  ];

  const table = useReactTable({
    data: defaultData,
    columns: columns,
    getCoreRowModel: getCoreRowModel(),
    state: {
      pagination,
    },
    onPaginationChange: setPagination,
    getPaginationRowModel: getPaginationRowModel(),
    debugAll: true,
  });

  if (!sessionData) {
    return <LoggedOut />;
  }

  console.log(savedTable);

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
            {sessionData.user.name}
          </span>
          <button
            className="min-w-max justify-self-end px-2 hover:underline"
            onClick={() => void signOut()}
          >
            Sign Out
          </button>
        </nav>
        <main className="flex h-screen flex-col items-center justify-center bg-gradient-to-b from-[#243e36] to-[#c2a83e]">
          <table className="w-full ">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <th key={header.id} colSpan={header.colSpan}>
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
            <tbody>
              {table.getRowModel().rows.map((row) => {
                return (
                  <tr key={row.id}>
                    {row.getVisibleCells().map((cell) => {
                      return (
                        <td key={cell.id}>
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
          <pre>{JSON.stringify(pagination, null, 2)}</pre>
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
