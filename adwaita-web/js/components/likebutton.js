class AdwLikeButton extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        this.initialLiked = this.hasAttribute('initial-liked') && this.getAttribute('initial-liked') !== 'false';
        this.initialLikeCount = parseInt(this.getAttribute('initial-like-count'), 10) || 0;
        this.itemId = this.getAttribute('item-id');
        this.itemType = this.getAttribute('item-type');

        this.state = {
            liked: this.initialLiked,
            likeCount: this.initialLikeCount,
        };

        this.render();
    }

    render() {
        const likeIcon = this.state.liked ? 'icon-actions-starred-symbolic' : 'icon-actions-star-symbolic';
        const likeLabel = this.state.liked ? 'Unlike' : 'Like';

        this.shadowRoot.innerHTML = `
            <style>
                /* We can't use url_for here, so we'll have to rely on the global stylesheet */
                @import url("/static/css/adwaita-skin.css");
            </style>
            <div class="like-section adw-box adw-box-horizontal adw-box-spacing-xs align-center">
                <button class="adw-button small flat" aria-label="${likeLabel}">
                    <span class="adw-icon ${likeIcon}"></span>
                </button>
                <span class="adw-label caption like-count">${this.state.likeCount}</span>
            </div>
        `;

        this.shadowRoot.querySelector('button').addEventListener('click', this.toggleLike.bind(this));
    }

    async toggleLike() {
        const action = this.state.liked ? 'unlike' : 'like';
        const url = `/like/${action}/${this.itemType}/${this.itemId}`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                },
            });

            if (response.ok) {
                const data = await response.json();
                this.state.liked = data.user_has_liked;
                this.state.likeCount = data.new_like_count;
                this.render();
            } else {
                console.error('Failed to toggle like');
            }
        } catch (error) {
            console.error('Error toggling like:', error);
        }
    }
}

customElements.define('adw-like-button', AdwLikeButton);
