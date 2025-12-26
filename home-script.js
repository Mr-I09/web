document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.vlog-container');
    const header = document.querySelector('.site-header');
    const scrollTopBtn = document.getElementById('scrollTopBtn');

    // --- Эффект для шапки и кнопки "Наверх" при прокрутке ---
    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY > 50;
        header.classList.toggle('is-scrolled', scrolled);
        scrollTopBtn.classList.toggle('is-visible', window.scrollY > 300);
    }, { passive: true });

    // --- Логика кнопки "Наверх" ---
    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // --- Новая логика для Лайтбокса (просмотр изображений) ---
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxPrevBtn = document.querySelector('.lightbox-prev');
    const lightboxNextBtn = document.querySelector('.lightbox-next');

    let currentLightboxGroup = [];
    let currentLightboxIndex = 0;

    const updateLightbox = () => {
        if (currentLightboxGroup.length === 0) return;
        
        lightboxImg.src = currentLightboxGroup[currentLightboxIndex];
        lightboxImg.alt = `Изображение ${currentLightboxIndex + 1} из ${currentLightboxGroup.length}`;
        
        // Показываем или скрываем кнопки навигации в лайтбоксе
        if (currentLightboxGroup.length > 1) {
            lightbox.classList.add('has-gallery');
        } else {
            lightbox.classList.remove('has-gallery');
        }
    };

    const openLightbox = (mediaGroup, startIndex = 0) => {
        // Убедимся, что mediaGroup это всегда массив
        currentLightboxGroup = Array.isArray(mediaGroup) ? mediaGroup : [mediaGroup];
        currentLightboxIndex = startIndex;
        
        updateLightbox();
        
        lightbox.classList.add('is-active');
        document.body.classList.add('lightbox-open');
    };

    const closeLightbox = () => {
        lightbox.classList.remove('is-active');
        document.body.classList.remove('lightbox-open');
    };

    const nextLightboxItem = () => {
        currentLightboxIndex = (currentLightboxIndex + 1) % currentLightboxGroup.length;
        updateLightbox();
    };

    const prevLightboxItem = () => {
        currentLightboxIndex = (currentLightboxIndex - 1 + currentLightboxGroup.length) % currentLightboxGroup.length;
        updateLightbox();
    };

    // Закрытие лайтбокса по клику на фон или на крестик
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox || e.target.classList.contains('lightbox-close')) {
            closeLightbox();
        }
    });
    lightboxNextBtn.addEventListener('click', nextLightboxItem);
    lightboxPrevBtn.addEventListener('click', prevLightboxItem);

    // Управление лайтбоксом с клавиатуры
    const handleLightboxKeys = (e) => {
        if (!lightbox.classList.contains('is-active')) return;

        if (e.key === 'ArrowRight') {
            nextLightboxItem();
        } else if (e.key === 'ArrowLeft') {
            prevLightboxItem();
        } else if (e.key === 'Escape') {
            closeLightbox();
        }
    };
    window.addEventListener('keydown', handleLightboxKeys);

    // --- Новая логика для анимации постов при прокрутке ---
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            // Если элемент появился в области видимости
            if (entry.isIntersecting) {
                // Добавляем класс для запуска анимации
                entry.target.classList.add('is-visible');
                // Прекращаем наблюдение за этим элементом, т.к. анимация нужна один раз
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1 // Анимация начнется, когда 10% поста будет видно
    });

    // --- Логика загрузки и отображения постов ---

    function renderPosts(posts, likes, comments) {
        try {
            container.innerHTML = ''; // Очищаем контейнер от загрузчика

            posts.forEach(post => {
                // Находим лайки и комменты для текущего поста
                const postLikesData = likes.find(l => l.id == post.id);
                const postLikes = postLikesData ? postLikesData.count : 0;
                const postComments = comments.filter(c => c.postId == post.id);

                // --- Создаем HTML-структуру для поста ---
                const article = document.createElement('article');
                article.classList.add('vlog-post');
                article.id = `post-${post.id}`; // Уникальный ID для ссылки

                const postMedia = document.createElement('div');
                postMedia.classList.add('post-media');
                renderMedia(post.media, postMedia, post.title);

                const postContent = document.createElement('div');
                postContent.classList.add('post-content');
                postContent.innerHTML = `
                    <h2 class="post-title">${post.title}</h2>
                    ${post.date ? `<p class="post-date">${post.date}</p>` : ''}
                    <p class="post-description">${post.text.replace(/\n/g, '<br>')}</p>
                `;

                // --- Блок с действиями (лайки, поделиться) ---
                const postActions = document.createElement('div');
                postActions.className = 'post-actions';
                const isLiked = localStorage.getItem(`liked-post-${post.id}`) === 'true';
                postActions.innerHTML = `
                    <button class="action-btn like-btn ${isLiked ? 'is-liked' : ''}" data-post-id="${post.id}">
                        <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                        <span class="like-counter">${postLikes}</span>
                    </button>
                    <div class="share-actions">
                        <button class="action-btn copy-link-btn" data-post-id="${post.id}" title="Копировать ссылку">
                            <svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                        </button>
                        <a href="https://t.me/share/url?url=${encodeURIComponent(window.location.href.split('#')[0] + '#post-' + post.id)}&text=${encodeURIComponent(post.title)}" target="_blank" class="action-btn share-telegram-btn" title="Поделиться в Telegram">
                            <svg viewBox="0 0 24 24"><path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.58c-.28 1.13-1.04 1.4-1.74.88l-4.98-3.6-2.32 2.23c-.25.24-.47.45-.83.45z"/></svg>
                        </a>
                    </div>
                `;

                // --- Блок с комментариями ---
                const commentsSection = document.createElement('div');
                commentsSection.className = 'comments-section';
                const commentsList = postComments.map(c => `<div class="comment-item">${c.text}</div>`).join('');
                commentsSection.innerHTML = `
                    <h3 class="comments-title">Комментарии (${postComments.length})</h3>
                    <div class="comments-list">${commentsList || '<p class="no-comments">Комментариев пока нет.</p>'}</div>
                    <form class="comment-form" data-post-id="${post.id}">
                        <input type="text" placeholder="Ваш анонимный комментарий..." required>
                        <button type="submit">Отправить</button>
                    </form>
                `;

                article.appendChild(postMedia);
                article.appendChild(postContent);
                article.appendChild(postActions);
                article.appendChild(commentsSection);

                container.appendChild(article);
                observer.observe(article);
            });

            // Навешиваем обработчики событий на новые элементы
            addEventListenersToActions();

        } catch (error) {
            console.error('Ошибка при обработке данных из таблицы:', error);
            container.innerHTML = '<p class="error-message">Не удалось обработать данные постов.</p>';
        }
    }

    function fetchAndRenderPosts() {
        console.log('Загрузка постов из сети...');
        const POSTS_ID = '1pKJmjLJ9byOe6n0x4h4b4Ut6Ma9F4Y7m-Za_q2WW_vE';
        const LIKES_ID = '1hxPWL_ZEnm0mSSbMLytYylqVzujn7mRCRX61vl0RWoM';
        const COMMENTS_ID = '18BeK-nnLcq-b1vCXBOVh2cks2fGtL8BGpsESo5NqGeU';
 
        const fetchSheetData = (sheetId) => {
            const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&_=${new Date().getTime()}`;
            const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
            return fetch(proxyUrl)
                .then(res => res.ok ? res.json() : Promise.reject(`Ошибка сети для ${sheetId}`))
                .then(data => JSON.parse(data.contents.substring(47).slice(0, -2)));
        };
 
        Promise.all([
            fetchSheetData(POSTS_ID),
            fetchSheetData(LIKES_ID),
            fetchSheetData(COMMENTS_ID)
        ]).then(([postsData, likesData, commentsData]) => {
            const posts = postsData.table.rows.map(r => ({ id: r.c[0]?.v, title: r.c[1]?.v, text: r.c[2]?.v, media: r.c[3]?.v, date: r.c[4]?.f }));
            const likes = likesData.table.rows.map(r => ({ id: r.c[0]?.v, count: r.c[1]?.v || 0 }));
            const comments = commentsData.table.rows.map(r => ({ postId: r.c[0]?.v, text: r.c[1]?.v }));
            renderPosts(posts, likes, comments);
        }).catch(error => {
            console.error('Ошибка при загрузке данных из таблиц:', error);
            container.innerHTML = '<p class="error-message">Не удалось загрузить посты. Проверьте консоль.</p>';
        });
    }

    // --- Загрузка всех данных ---
    const cachedData = sessionStorage.getItem('vlogPostsData');

    if (cachedData) {
        try {
            console.log('Посты загружены из кеша.');
            const allData = JSON.parse(cachedData);
            renderPosts(allData.posts, allData.likes, allData.comments);
        } catch (e) {
            console.error('Не удалось обработать данные из кеша. Загрузка из сети...', e);
            fetchAndRenderPosts(); // Вызываем функцию загрузки, если кеш поврежден
        } finally {
            // Очищаем кеш в любом случае, чтобы не пытаться парсить битые данные снова
            sessionStorage.removeItem('vlogPostsData');
        }
    } else {
        console.log('Кеш пуст. Загрузка постов из сети...');
        fetchAndRenderPosts();
    }

    // --- API для взаимодействия с Google Apps Script ---
    const DEPLOYED_URL = 'https://script.google.com/macros/s/AKfycbwiFQ9_kAi0Ovbq6uaNPTKXdKh3EgScObQFrsOcT7VAQpKmUOQJxUc5i4bebrt_22oE2A/exec'; // <-- ВСТАВЬТЕ СЮДА СВОЙ URL

    function postDataToApi(data) {
        // Проверка, заменен ли URL-заглушка
        if (DEPLOYED_URL.includes('ВАШ_URL_ИЗ_APPS_SCRIPT')) {
            const errorMessage = 'ОШИБКА: URL для API не был заменен в файле home-script.js. Запись данных невозможна.';
            console.error(errorMessage);
            return Promise.reject(new Error(errorMessage));
        }
        return fetch(DEPLOYED_URL, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // Apps Script требует text/plain
        }).then(res => res.json());
    }

    // --- Новые функции для рендеринга медиа ---

    function getYoutubeId(url) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }

    function renderMedia(mediaString, container, title) {
        if (!mediaString) {
            container.innerHTML = '<span>[ Медиа ]</span>';
            return;
        }

        const youtubeId = getYoutubeId(mediaString);
        if (youtubeId) {
            container.innerHTML = `<iframe src="https://www.youtube.com/embed/${youtubeId}" title="${title}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
            return;
        }

        const imageUrls = mediaString.split(',').map(url => url.trim()).filter(Boolean);

        if (imageUrls.length > 1) {
            renderImageSlider(imageUrls, container, title);
        } else if (imageUrls.length === 1) {
            renderSingleImage(imageUrls[0], container, title);
        } else {
            container.innerHTML = '<span>[ Медиа ]</span>';
        }
    }

    function renderSingleImage(url, container, title) {
        // #19 Анимация загрузки изображений (shimmer)
        const shimmer = document.createElement('div');
        shimmer.className = 'shimmer-wrapper';
        container.appendChild(shimmer);

        const img = document.createElement('img');
        img.src = url;
        img.referrerPolicy = "no-referrer";
        img.alt = title;
        img.onload = () => {
            shimmer.remove(); // Убираем заглушку после загрузки
            container.appendChild(img);
        };
        img.onerror = () => {
            console.error(`Не удалось загрузить изображение по ссылке: ${url}`);
            container.innerHTML = '<div class="slider-error"><span>Ошибка загрузки<br>изображения</span></div>';
        };
        container.addEventListener('click', () => openLightbox(url));
    }

    function renderImageSlider(urls, container, title) {
        container.classList.add('slider-container');
        
        const wrapper = document.createElement('div');
        wrapper.classList.add('slider-wrapper');
        
        urls.forEach((url, index) => {
            const slide = document.createElement('div');
            slide.classList.add('slide');

            const shimmer = document.createElement('div');
            shimmer.className = 'shimmer-wrapper';
            slide.appendChild(shimmer);

            const img = document.createElement('img');
            img.src = url;
            img.referrerPolicy = "no-referrer";
            img.alt = `${title} - изображение ${index + 1}`;
            img.onload = () => {
                shimmer.remove();
                slide.appendChild(img);
            };
            img.onerror = () => {
                console.error(`Не удалось загрузить изображение [${index + 1}/${urls.length}] по ссылке: ${url}`);
                slide.innerHTML = '<div class="slider-error"><span>Ошибка загрузки<br>изображения</span></div>';
            };
            
            wrapper.appendChild(slide);
        });
        
        container.appendChild(wrapper);

        const prevBtn = document.createElement('button');
        prevBtn.className = 'slider-btn prev';
        prevBtn.innerHTML = '&#10094;';
        
        const nextBtn = document.createElement('button');
        nextBtn.className = 'slider-btn next';
        nextBtn.innerHTML = '&#10095;';
        
        container.append(prevBtn, nextBtn);

        let currentIndex = 0;
        const updateSlider = () => wrapper.style.transform = `translateX(-${currentIndex * 100}%)`;

        prevBtn.addEventListener('click', e => {
            e.stopPropagation();
            currentIndex = (currentIndex - 1 + urls.length) % urls.length;
            updateSlider();
        });
        nextBtn.addEventListener('click', e => {
            e.stopPropagation();
            currentIndex = (currentIndex + 1) % urls.length;
            updateSlider();
        });
        wrapper.addEventListener('click', () => openLightbox(urls, currentIndex));
    }

    function addEventListenersToActions() {
        // Лайки
        document.querySelectorAll('.like-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const postId = btn.dataset.postId;
                if (localStorage.getItem(`liked-post-${postId}`) === 'true') return;

                localStorage.setItem(`liked-post-${postId}`, 'true');
                btn.classList.add('is-liked');

                const counter = btn.querySelector('.like-counter');
                const currentLikes = parseInt(counter.textContent, 10);
                counter.textContent = currentLikes + 1;
                
                // #32 Анимация счетчика
                counter.classList.add('is-animating');
                counter.addEventListener('animationend', () => counter.classList.remove('is-animating'), { once: true });

                postDataToApi({ action: 'addLike', postId: postId })
                    .then(response => {
                        console.log('Ответ от API (лайк):', response);
                        if (response.status !== 'success') {
                            console.error('API вернуло ошибку при добавлении лайка:', response.message);
                        }
                    })
                    .catch(err => console.error('Сетевая ошибка при отправке лайка:', err));
            });
        });

        // Копирование ссылки
        document.querySelectorAll('.copy-link-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const postId = btn.dataset.postId;
                const url = window.location.href.split('#')[0] + '#post-' + postId;
                navigator.clipboard.writeText(url).then(() => {
                    btn.classList.add('is-copied');
                    setTimeout(() => btn.classList.remove('is-copied'), 1500);
                });
            });
        });

        // Формы комментариев
        document.querySelectorAll('.comment-form').forEach(form => {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const postId = form.dataset.postId;
                const input = form.querySelector('input');
                const commentText = input.value.trim();
                if (!commentText) return;

                const commentsList = form.previousElementSibling;
                if (commentsList.querySelector('.no-comments')) {
                    commentsList.innerHTML = ''; // Убираем надпись "нет комментариев"
                }
                const newComment = document.createElement('div');
                newComment.className = 'comment-item';
                newComment.textContent = commentText;
                commentsList.appendChild(newComment);
                input.value = '';

                postDataToApi({ action: 'addComment', postId: postId, comment: commentText })
                    .then(response => {
                        console.log('Ответ от API (комментарий):', response);
                        if (response.status !== 'success') {
                            console.error('API вернуло ошибку при добавлении комментария:', response.message);
                        }
                    })
                    .catch(err => console.error('Сетевая ошибка при отправке комментария:', err));
            });
        });
    }
});