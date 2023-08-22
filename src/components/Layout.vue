<template>
  <div class="flex gap-3">
    <div class="w-48">
      <el-menu class="el-menu-demo" mode="vertical">
        <el-menu-item
          index="1"
          @click="
            () => {
              router.push('/roam');
            }
          "
          >漫游</el-menu-item
        >
        <el-menu-item
          index="2"
          @click="
            () => {
              router.push('/car');
            }
          "
          >Car</el-menu-item
        >
      </el-menu>
    </div>
    <div class="flex-1">
      <RouterView />
    </div>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";
const router = useRouter();
</script>

<style scoped></style>
