export function renderFeed(posts) {
    if (!posts || posts.length === 0) {
        return `
            <div class="adw-status-page">
                <span class="adw-icon icon-actions-document-new-symbolic adw-status-page-icon app-status-page-icon"></span>
                <h2 class="adw-status-page-title">No Posts Yet</h2>
                <p class="adw-status-page-description">Be the first to create a post and share your thoughts!</p>
                <div class="adw-status-page-actions">
                    <a href="#/create" class="adw-button suggested-action">Create a Post</a>
                </div>
            </div>
        `;
    }

    return `
        <h1 class="adw-title-1 page-title-centered">Latest Updates</h1>
        <div class="blog-posts-container">
            ${posts.map(renderPostCard).join('')}
        </div>
    `;
}

export function renderPostCard(post) {
    const postData = post.data;
    return `
        <article class="adw-card blog-post-item-card">
            <header class="blog-post-card__header">
                <div class="blog-post-card__meta adw-label caption">
                    By: <a href="#/profile/${postData.author.id}" class="adw-link">${postData.author.full_name || 'Unknown Author'}</a>
                    on <time datetime="${postData.created_at}">${new Date(postData.created_at).toLocaleString()}</time>
                </div>
            </header>
            <a href="#/posts/${postData.id}" class="adw-link post-content-link">
                <div class="blog-post-card__excerpt styled-text-content">
                    ${postData.content.substring(0, 600)}
                </div>
            </a>
            <footer class="blog-post-card__footer">
                <div class="blog-post-card__terms">
                    ${renderCategories(postData.categories)}
                    ${renderTags(postData.tags)}
                </div>
                <a href="#/posts/${postData.id}" class="adw-button flat read-more-link">Read More <span class="adw-icon icon-actions-go-next-symbolic"></span></a>
            </footer>
            <div class="adw-card__actions card-secondary-actions">
                ${renderLikeButton(postData)}
            </div>
        </article>
    `;
}

function renderCategories(categories) {
    if (!categories || categories.length === 0) return '';
    return `
        <div class="post-categories-list meta-section">
            <strong class="adw-label caption meta-label-strong">Categories:</strong>
            ${categories.map(category => `<a href="#/category/${category.slug}" class="adw-button flat compact">${category.name}</a>`).join('')}
        </div>
    `;
}

function renderTags(tags) {
    if (!tags || tags.length === 0) return '';
    return `
        <div class="tags-summary meta-section">
            <strong class="adw-label caption meta-label-strong">Tags:</strong>
            ${tags.map(tag => `<a href="#/tag/${tag.slug}" class="adw-button flat compact tag-pill">${tag.name}</a>`).join('')}
        </div>
    `;
}

function renderLikeButton(item) {
    // This is a simplified version. A real implementation would need to handle state and events.
    return `
        <button class="adw-button" data-item-id="${item.id}" data-item-type="${item.type}">
            <span class="adw-icon icon-actions-emblem-favorite-symbolic"></span>
            <span>${item.like_count}</span>
        </button>
    `;
}
