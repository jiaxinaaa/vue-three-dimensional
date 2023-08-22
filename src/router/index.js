import { createRouter, createWebHashHistory } from "vue-router";
import Layout from "../components/Layout.vue";
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      name: "home",
      component: Layout,
      redirect: "/roam",

      children: [
        {
          path: "roam",
          name: "漫游",
          component: () => import("@/pages/Roam.vue"),
        },
        {
          path: "car",
          name: "车",
          component: () => import("@/pages/Car.vue"),
        },
      ],
    },
  ],
});

export default router;
