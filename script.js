window.addEventListener('load', () => {
    const preloader = document.getElementById('preloader');
    const typingTextElement = document.getElementById('typing-text');
    const text = typingTextElement.textContent;

    // --- Новая логика для звезд и мемов ---
    const starsContainer = document.getElementById('stars-background');
    const memePaths = [
        'Resourse/Meme/Freddy.png',
        'Resourse/Meme/pokemon.png',
        'Resourse/Meme/Педобир.png',
        'Resourse/Meme/wolf.png'
    ];
    const numberOfStars = 50; // Создадим больше "звезд" для плотности
    const memeChance = 0.05; // 5% шанс, что звезда будет мемом

    for (let i = 0; i < numberOfStars; i++) {
        let star;
        if (Math.random() < memeChance) {
            // Создаем мем
            star = document.createElement('img');
            star.src = memePaths[Math.floor(Math.random() * memePaths.length)];
            star.classList.add('meme-star');
            star.style.setProperty('--scale', Math.random() * 0.4 + 0.4); // Уменьшили масштаб мемов (от 0.4 до 0.8)
        } else {
            // Создаем обычную звезду
            star = document.createElement('div');
            star.classList.add('star');
            star.style.setProperty('--scale', Math.random() * 1.5 + 0.5); // Случайный размер
        }

        // Общие случайные параметры для всех "звезд"
        // Изменяем логику спавна: теперь они появляются за пределами экрана
        if (Math.random() > 0.5) {
            // Начинает сверху, в случайной точке по горизонтали
            star.style.top = `${-Math.random() * 20 - 5}%`; // от -5% до -25%
            star.style.left = `${Math.random() * 100}%`;
        } else {
            // Начинает справа, в случайной точке по вертикали
            star.style.top = `${Math.random() * 100}%`;
            star.style.left = `${100 + Math.random() * 20}%`; // от 100% до 120%
        }
        star.style.animationDuration = `${Math.random() * 5 + 3}s`; // от 3 до 8 секунд
        star.style.animationDelay = `${Math.random() * 5}s`; // задержка до 5 секунд

        starsContainer.appendChild(star);
    }

    // Разбиваем текст на буквы, оборачиваем каждую в <span>
    // и добавляем обратно в h1 для индивидуальной анимации
    typingTextElement.textContent = ''; // Очищаем исходный текст
    text.split('').forEach((char, index) => {
        const span = document.createElement('span');
        // Заменяем пробел на неразрывный, чтобы он не "схлопнулся"
        span.textContent = char === ' ' ? '\u00A0' : char;
        // Задаем ступенчатую задержку для анимации появления
        span.style.animationDelay = `${index * 0.08}s`;
        typingTextElement.appendChild(span);
    });

    // --- Новая логика для предзагрузки данных для главной страницы ---
    const prefetchData = () => {
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
            const allData = {
                posts: postsData.table.rows.map(r => ({ id: r.c[0]?.v, title: r.c[1]?.v, text: r.c[2]?.v, media: r.c[3]?.v, date: r.c[4]?.f })),
                likes: likesData.table.rows.map(r => ({ id: r.c[0]?.v, count: r.c[1]?.v || 0 })),
                comments: commentsData.table.rows.map(r => ({ postId: r.c[0]?.v, text: r.c[1]?.v }))
            };
            // Сохраняем все данные в кеш
            sessionStorage.setItem('vlogPostsData', JSON.stringify(allData));
            console.log('Все данные предзагружены и сохранены в кеш.');
        }).catch(error => { // Добавляем throw, чтобы промис корректно отклонялся при ошибке
            console.error('Ошибка предзагрузки данных:', error);
            throw error;
        });
    };
    const prefetchPromise = prefetchData(); // Запускаем предзагрузку и сохраняем промис

    // --- Новая логика для пропуска заставки ---
    let isExiting = false;
    let preloaderTimeout;

    const exitPreloader = () => {
        if (isExiting) return;
        isExiting = true;

        // Отменяем автоматический выход, если он еще не сработал
        clearTimeout(preloaderTimeout);

        // Убираем слушатели событий, чтобы не сработали повторно
        window.removeEventListener('keydown', exitPreloader);
        window.removeEventListener('click', exitPreloader);

        // 1. Запускаем анимацию исчезновения контента немедленно
        preloader.classList.add('preloader--hiding');

        // 2. Ждем одновременно и завершения предзагрузки, и минимального времени анимации (500мс)
        Promise.all([
            prefetchPromise,
            new Promise(resolve => setTimeout(resolve, 500)) // Длительность анимации fadeOutContent
        ]).catch(error => {
            // Если предзагрузка не удалась, мы не прерываем переход.
            // Просто выводим предупреждение. Главная страница загрузит данные сама.
            console.warn('Предзагрузка не удалась, но переход продолжается.', error);
        }).then(() => {
            // 3. Когда данные загружены (или произошла ошибка) и анимация контента завершена,
            // начинаем скрывать фон прелоадера.
            preloader.style.opacity = '0';

            // 4. После того как фон полностью исчезнет, перенаправляем на главную страницу.
            preloader.addEventListener('transitionend', () => {
                window.location.href = 'home.html';
            });
        });
    };

    // Время до автоматического исчезновения заставки
    const startExitTime = 6000; // Увеличим время, чтобы насладиться звездами
    preloaderTimeout = setTimeout(exitPreloader, startExitTime);

    // Добавляем слушатели для пропуска по клику или нажатию клавиши
    window.addEventListener('keydown', exitPreloader);
    window.addEventListener('click', exitPreloader);
});