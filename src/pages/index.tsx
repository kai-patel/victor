import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";

import { api } from "~/utils/api";

// Theme: #f1f7ed #243e36 #7ca982 #e0eec6 #c2a83e

const Home: NextPage = () => {
  const hello = api.example.hello.useQuery({ text: "from tRPC" });

  const { data: sessionData } = useSession();

  if (!sessionData) {
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
        <nav className="min-w-screen sticky top-0 flex flex-row bg-[#7ca982] p-4 shadow">
          <span className="font-bold">Victor</span>
          <span className="text-white">{sessionData.user.name}</span>
          <button onClick={() => void signOut()}>Sign Out</button>
        </nav>
        <main className="flex h-screen flex-col items-center justify-center bg-gradient-to-b from-[#243e36] to-[#c2a83e]">
          <AuthShowcase />
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
      <p className="text-center text-2xl text-white">
        {sessionData && <span>Logged in as {sessionData.user?.name}</span>}
      </p>
      <button
        className="rounded-full bg-white/10 px-10 py-3 font-semibold text-white no-underline transition hover:bg-white/20"
        onClick={sessionData ? () => void signOut() : () => void signIn()}
      >
        {sessionData ? "Sign out" : "Sign in"}
      </button>
    </div>
  );
};
