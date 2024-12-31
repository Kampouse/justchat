import type { RequestHandler } from "@builder.io/qwik-city";
export const onGet: RequestHandler = async () => {
  //get the auth data from the request

  //type of key value pair object
  type publicpath = { [key: string]: string };

  const publicpath: publicpath = {
    "/": "public",
    "/about": "public",
    "/contact": "public",
    "/login/": "public",
    "/login": "public",
    "/signup": "public",
    "/logout": "public",
    "/landing": "public",
    "/landing/": "public",
  };

  //const data = req.sharedMap.get("session") as Session;
  //get current session time and compare with expires time

  //string contain method
};
