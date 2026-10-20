import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import Home from './views/Home.vue'
import TodayEat from './views/TodayEat.vue'
import TableDesign from './views/TableDesign.vue'
import Favorites from './views/Favorites.vue'
import Gallery from './views/Gallery.vue'
import HowToCook from './views/HowToCook.vue'
import SauceDesign from './views/SauceDesign.vue'
import FortuneCooking from './views/FortuneCooking.vue'
import SettingsDemo from './views/SettingsDemo.vue'
import JManage from './views/JManage.vue'
import Support from './views/Support.vue'
import { clearLegacyCredentials } from './utils/clearLegacyCredentials'
import './style.css'

const routes = [
    { path: '/', component: Home },
    { path: '/today-eat', component: TodayEat },
    { path: '/table-design', component: TableDesign },
    { path: '/favorites', component: Favorites },
    { path: '/gallery', component: Gallery },
    { path: '/how-to-cook', component: HowToCook },
    { path: '/sauce-design', component: SauceDesign },
    { path: '/fortune-cooking', component: FortuneCooking },
    { path: '/settings-demo', component: SettingsDemo },
    { path: '/JManage', component: JManage },
    { path: '/support', component: Support }
]

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes
})

// 初始化应用
const app = createApp(App).use(router)

// Remove credentials left by older browser-side configuration versions.
clearLegacyCredentials()

// 挂载应用
app.mount('#app')
