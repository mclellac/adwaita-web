import { getFeed } from './api.js';
import { renderFeed } from './components.js';

const routes = {
    '/': 'home',
    '/posts/:id': 'post',
    '/profile/:id': 'profile',
    '/login': 'login',
    '/register': 'register',
    '/settings': 'settings',
    '/dashboard': 'dashboard',
    '/search': 'search',
    '/about': 'about',
    '/contact': 'contact'
};

const router = async () => {
    const content = document.getElementById('content');
    const path = location.hash.slice(1).toLowerCase() || '/';
    const pathParts = path.split('/');

    let route = routes[path];
    let params = {};

    if (!route) {
        for (const r in routes) {
            const routeParts = r.split('/');
            if (routeParts.length === pathParts.length) {
                let match = true;
                for (let i = 0; i < routeParts.length; i++) {
                    if (routeParts[i].startsWith(':')) {
                        params[routeParts[i].slice(1)] = pathParts[i];
                    } else if (routeParts[i] !== pathParts[i]) {
                        match = false;
                        break;
                    }
                }
                if (match) {
                    route = routes[r];
                    break;
                }
            }
        }
    }

    switch (route) {
        case 'home':
            const feed = await getFeed();
            content.innerHTML = renderFeed(feed.items);
            break;
        case 'post':
            // Render post component
            break;
        case 'profile':
            // Render profile component
            break;
        case 'login':
            // Render login component
            break;
        case 'register':
            // Render register component
            break;
        case 'settings':
            // Render settings component
            break;
        case 'dashboard':
            // Render dashboard component
            break;
        default:
            content.innerHTML = '<h1>404 Not Found</h1>';
    }
};

export { router };
