document.addEventListener('DOMContentLoaded', function() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const lectureCards = document.querySelectorAll('.lecture-card');
    const searchInput = document.getElementById('searchInput');
    let activeFilter = 'all';

    window.checkAccess = function(lectureId, buttonElement) {
        const code = prompt('Введите кодовое слово для доступа к видео:');
        const accessCodes = {
            'parallel': 'параллель',
            'crossroad': 'перекресток',
        };
        const videoLinks = {
            'parallel': 'https://rutube.ru/video/1f72289c07471a38ed98b9f8fd1d08fd/?r=wd',
            'crossroad': 'https://rutube.ru/video/1f72289c07471a38ed98b9f8fd1d08fd/?r=wd',
        };
        if (code && code.toLowerCase() === accessCodes[lectureId]) {
            alert('Доступ разрешен! Видео скоро откроется');
            window.open(videoLinks[lectureId], '_blank');
        } else {
            alert('Неверное кодовое слово!');
        }
    };

    function filterCards() {
        const searchText = searchInput ? searchInput.value.toLowerCase().trim() : '';
        lectureCards.forEach(card => {
            const cardCategory = card.getAttribute('data-category');
            let categoryMatch = (activeFilter === 'all' || cardCategory === activeFilter);
            
            let searchMatch = true;
            if (searchText !== '') {
                const cardTitle = card.querySelector('h3, .h3, h4, .h4')?.innerText.toLowerCase() || '';
                const cardDesc = card.querySelector('p')?.innerText.toLowerCase() || '';
                searchMatch = cardTitle.includes(searchText) || cardDesc.includes(searchText);
            }
            
            if (categoryMatch && searchMatch) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            filterButtons.forEach(btn => {
                btn.classList.remove('btn-danger', 'active');
                btn.classList.add('btn-outline-danger');
            });

            this.classList.remove('btn-outline-danger');
            this.classList.add('btn-danger', 'active');

            activeFilter = this.getAttribute('data-filter');
            filterCards();
        });
    });
    if (searchInput) {
        searchInput.addEventListener('input', filterCards);
    }
});

function handleLoginClick() {
    const selectedRole = document.querySelector('input[name="role"]:checked').value;
    
    if (selectedRole === 'student') {
        window.location.href = 'pa.html';
    } else {
        window.location.href = 'pa_inst.html';
    }
}

const INSTRUCTOR_ID = 2;
async function loadInstructorSchedule() {
    try {
        const response = await fetch('http://localhost:3000/lessons');
        const allLessons = await response.json();
        
        const myLessons = allLessons.filter(lesson => lesson.instructorId === INSTRUCTOR_ID);
        
        const today = new Date().toISOString().split('T')[0];
        const weekLater = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
        
        const todayLessons = myLessons.filter(lesson => lesson.date === today);
        const weekLessons = myLessons.filter(lesson => lesson.date > today && lesson.date <= weekLater);
        
        todayLessons.sort((a, b) => a.time.localeCompare(b.time));
        weekLessons.sort((a, b) => {
            if (a.date === b.date) return a.time.localeCompare(b.time);
            return a.date.localeCompare(b.date);
        });
        
        renderLessonsList(todayLessons, 'todayLessons');
        renderLessonsList(weekLessons, 'weekLessons');
        
    } catch (error) {
        document.getElementById('todayLessons').innerHTML = `
            <div class="alert alert-danger">Ошибка. Запустите: json-server --watch db.json --port 3000</div>
        `;
    }
}

// Отображение списка занятий
function renderLessonsList(lessons, containerId) {
    const container = document.getElementById(containerId);
    
    if (lessons.length === 0) {
        container.innerHTML = `<div class="alert alert-light text-center">Нет занятий</div>`;
        return;
    }
    
    let html = '';
    for (const lesson of lessons) {
        let statusBadge = '';
        let actionButton = '';
        
        if (lesson.status === 'completed') {
            statusBadge = '<span class="badge bg-secondary fs-6 p-2">Проведено</span>';
            actionButton = '<button class="btn btn-outline-secondary rounded-pill" disabled>Проведено</button>';
        } else if (lesson.status === 'booked') {
            statusBadge = '<span class="badge bg-success fs-6 p-2">Записан</span>';
            actionButton = `<button onclick="markLessonCompleted(${lesson.id})" class="btn btn-success rounded-pill px-4">Отметить проведённым</button>`;
        } else {
            statusBadge = '<span class="badge bg-warning text-dark fs-6 p-2">Свободно</span>';
            actionButton = '<button class="btn btn-outline-danger rounded-pill px-4" disabled>Свободен</button>';
        }
        
        const studentDisplay = lesson.studentName 
            ? `<span class="text-success fw-bold">${lesson.studentName}</span>` 
            : '<span class="text-secondary">Свободно</span>';
        
        const dateDisplay = containerId === 'weekLessons' ? formatDate(lesson.date) : lesson.date;
        
        html += `
            <div class="card border-0 shadow-sm rounded-4 hover-lift">
                <div class="card-body p-4">
                    <div class="row align-items-center">
                        <div class="col-md-3">
                            <div class="fw-bold text-danger mb-1">${dateDisplay}</div>
                            <div class="fs-3 fw-bold">${lesson.time}</div>
                            <div class="text-secondary small">${lesson.duration} минут</div>
                        </div>
                        <div class="col-md-4">
                            <div class="d-flex align-items-center gap-2">
                                <span class="fs-2">👨‍🎓</span>
                                <div>
                                    <div class="fw-bold">Ученик</div>
                                    <div>${studentDisplay}</div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            ${statusBadge}
                        </div>
                        <div class="col-md-2 text-end">
                            ${actionButton}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

// Форматирование даты
function formatDate(dateString) {
    const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    const date = new Date(dateString);
    const dayName = days[date.getDay()];
    const [month, day] = dateString.split('-').slice(1);
    return `${dayName}, ${day}.${month}`;
}

// Отметить занятие как проведённое
async function markLessonCompleted(lessonId) {
    if (!confirm('Отметить это занятие как проведённое?')) return;
    
    try {
        const response = await fetch(`http://localhost:3000/lessons/${lessonId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'completed' })
        });
        
        if (response.ok) {
            alert('Занятие отмечено как проведённое!');
            await loadInstructorSchedule();
        } else {
            alert('Ошибка при обновлении');
        }
    } catch (error) {
        alert('Ошибка подключения к серверу');
    }
}

// Запускаем если мы на странице инструктора
if (document.getElementById('todayLessons')) {
    loadInstructorSchedule();
}