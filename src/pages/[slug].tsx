// slug matches on everything that doesnt match any of the other routes

import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { LoadingPage } from "~/components/Loading";
import { api } from "~/utils/api";
import { PageLayout } from "~/components/Layout";
import Image from "next/image";
import { PostView } from "~/components/PostView";
import { generateSSGHelper } from "~/server/helpers/ssgHelper";

const ProfileFeed = (props: { userId: string }) => {
  const { data, isLoading } = api.posts.getPostsByUserId.useQuery({
    userId: props.userId,
  });

  if (isLoading) return <LoadingPage />;

  if (!data || data.length === 0) return <div>No posts yet</div>;

  return (
    <div className="flex flex-col">
      {data.map((fullPost) => (
        <PostView {...fullPost} key={fullPost.post.id} />
      ))}
    </div>
  );
};

const ProfilePage: NextPage<{ username: string }> = ({ username }) => {
  const { data, isLoading } = api.profile.getUserByUsername.useQuery({
    username,
  });

  if (isLoading) return <LoadingPage />;

  if (!data) return <div>404</div>;

  return (
    <>
      <Head>
        <title>{data.username}</title>
      </Head>
      <PageLayout>
        <div className="relative h-36 bg-slate-600">
          <Image
            src={data.profileImageUrl}
            alt={`${data.username ?? ""}'s profile pic`}
            width={128}
            height={128}
            className="absolute bottom-0 left-0 -mb-[64px] ml-4 rounded-full border-4 border-black bg-black"
          />
        </div>
        <div className="h-[64px]"></div>

        <div className="p-4 text-2xl font-bold">{`@${
          data.username ?? ""
        }`}</div>
        <div className="w-full border-b border-slate-400" />
        <ProfileFeed userId={data.id} />
      </PageLayout>
    </>
  );
};

// Treated like static asset and rerun validation when and how you choose
export const getStaticProps: GetStaticProps = async (context) => {
  const ssg = generateSSGHelper();

  const slug = context.params?.slug;

  if (typeof slug !== "string") throw new Error("no slug");

  // slug is still including the "@" so it isnt fetching it.
  // add this line so it removes the @
  const username = slug.replace("@", "");

  // prefetch - helper that fetches data ahead of time and hydrate it  through serverSideProps
  // in _app.tsx - since I am wrapping MyApp with TRPC, it will hydrate all that data through react query
  // Data is there when the page loads and the loading state will almost never hit because inputs are the same
  await ssg.profile.getUserByUsername.prefetch({ username });

  return {
    // dehydrate - takes all things we prefetched and puts it in a shape that can be parsed through Next JS staticProps
    props: {
      trpcState: ssg.dehydrate(),
      username,
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

export default ProfilePage;
