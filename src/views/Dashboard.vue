<template>

    <div class="n-layout-page-header">
        <n-card :bordered="false" title="工作台">
            <n-grid cols="2 s:1 m:1 l:2 xl:2 2xl:2" responsive="screen">
                <n-gi>
                    <div class="flex items-center">
                        <div>
                            <n-avatar circle :size="64" :src="schoolboy" />
                        </div>
                        <div>
                            <p class="px-4 text-xl">早安，Admin，开始您一天的工作吧！</p>
                           
                        </div>
                    </div>
                </n-gi>
              
            </n-grid>
        </n-card>
    </div>

</template>

<script>
export default { name: 'DashboardWorkplace' };
</script>



<style lang="less" scoped>

</style>