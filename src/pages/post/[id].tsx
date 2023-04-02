// slug matches on everything that doesnt match any of the other routes

import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { LoadingPage } from "~/components/Loading";
import { api } from "~/utils/api";
import { PageLayout } from "~/components/Layout";

import { PostView } from "~/components/PostView";
import { generateSSGHelper } from "~/server/helpers/ssgHelper";

const SinglePostPage: NextPage<{ id: string }> = ({ id }) => {
  const { data, isLoading } = api.posts.getById.useQuery({
    id,
  });

  if (isLoading) return <LoadingPage />;

  if (!data) return <div>404</div>;

  return (
    <>
      <Head>
        <title>{`${data.post.content} - @${data.author.username}`}</title>
      </Head>
      <PageLayout>
        <PostView {...data} key={data.post.id} />
      </PageLayout>
    </>
  );
};

// Treated like static asset and rerun validation when and how you choose
export const getStaticProps: GetStaticProps = async (context) => {
  const ssg = generateSSGHelper();

  const id = context.params?.id;

  if (typeof id !== "string") throw new Error("no slug");

  // prefetch - helper that fetches data ahead of time and hydrate it  through serverSideProps
  // in _app.tsx - since I am wrapping MyApp with TRPC, it will hydrate all that data through react query
  // Data is there when the page loads and the loading state will almost never hit because inputs are the same
  await ssg.posts.getById.prefetch({ id });

  return {
    // dehydrate - takes all things we prefetched and puts it in a shape that can be parsed through Next JS staticProps
    props: {
      trpcState: ssg.dehydrate(),
      id,
    },
  };
};

export const getStaticPaths = () => {
  // blocking so it actually generates them
  // paths will have all the strings => if you pass in something then it generates them ahead of time
  // when it gets built it will generate them for these paths (overdrive user)
  // if paths: [] then it will generate them on load
  return { paths: [], fallback: "blocking" };
};

export default SinglePostPage;
