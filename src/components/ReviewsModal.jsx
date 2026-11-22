import { useState, useEffect } from 'react';
import { getServiceReviews, addReview } from '../api/reviews';

// Модальное окно просмотра и добавления отзывов об услуге
export default function ReviewsModal({
  service,
  user,
  isOpen,
  onClose,
  onOpenAuth,
  onReviewAdded
}) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Поиск и фильтрация по оценкам
  const [searchFilter, setSearchFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');

  // Форма отзыва
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null);

  useEffect(() => {
    if (isOpen && service) {
      setSearchFilter('');
      setRatingFilter('all');
      loadReviews();
    }
  }, [isOpen, service]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getServiceReviews(service.id);
      setReviews(data);
    } catch (err) {
      setError(err.message || 'Не удалось загрузить отзывы');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim() || comment.trim().length < 3) {
      alert('Пожалуйста, напишите отзыв (не менее 3 символов)');
      return;
    }

    try {
      setSubmitting(true);
      await addReview({
        service_id: service.id,
        rating: Number(rating),
        comment: comment.trim()
      });
      setComment('');
      setSubmitSuccess('Спасибо! Ваш отзыв успешно опубликован.');
      await loadReviews();
      if (onReviewAdded) onReviewAdded();
      setTimeout(() => setSubmitSuccess(null), 3000);
    } catch (err) {
      alert(err.message || 'Ошибка отправки отзыва');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !service) return null;

  const filteredReviews = reviews.filter((rev) => {
    if (ratingFilter !== 'all' && Number(rev.rating) !== Number(ratingFilter)) {
      return false;
    }
    if (searchFilter && searchFilter.trim()) {
      const q = searchFilter.trim().toLowerCase();
      const matchAuthor = (rev.author_name || '').toLowerCase().includes(q);
      const matchComment = (rev.comment || '').toLowerCase().includes(q);
      if (!matchAuthor && !matchComment) return false;
    }
    return true;
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>Отзывы об услуге</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              {service.name} ({service.category_name})
            </p>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Состояние загрузки */}
          {loading && <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Загрузка отзывов...</p>}

          {/* Состояние ошибки */}
          {error && <p style={{ color: 'var(--danger-color)', textAlign: 'center' }}>{error}</p>}

          {/* Панель поиска и фильтрации по оценкам */}
          {!loading && reviews.length > 0 && (
            <div style={{
              background: 'rgba(0,0,0,0.02)',
              border: '1px solid var(--border-color)',
              padding: '10px 12px',
              borderRadius: '8px',
              marginBottom: '14px'
            }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Поиск по тексту отзыва или автору..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  style={{ fontSize: '13px', padding: '6px 10px' }}
                />
                {(searchFilter || ratingFilter !== 'all') && (
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => { setSearchFilter(''); setRatingFilter('all'); }}
                    style={{ fontSize: '12px', whiteSpace: 'nowrap' }}
                  >
                    Сбросить
                  </button>
                )}
              </div>

              {/* Кнопки фильтрации по оценкам */}
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Оценка:</span>
                {['all', '5', '4', '3', '2', '1'].map((rate) => {
                  const count = rate === 'all'
                    ? reviews.length
                    : reviews.filter(r => Number(r.rating) === Number(rate)).length;
                  if (rate !== 'all' && count === 0) return null;
                  return (
                    <button
                      key={rate}
                      type="button"
                      className={`btn btn-sm ${ratingFilter === rate ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => setRatingFilter(rate)}
                      style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}
                    >
                      <span>{rate === 'all' ? 'Все' : `${rate} ★`}</span>
                      <span style={{ opacity: 0.75 }}>({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Список отзывов */}
          {!loading && reviews.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px 0' }}>
              Пока нет отзывов на эту услугу.
            </p>
          )}

          {!loading && reviews.length > 0 && filteredReviews.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '16px 0', fontSize: '13px' }}>
              Отзывов с выбранными параметрами не найдено.
            </p>
          )}

          {!loading && filteredReviews.length > 0 && (
            <div style={{ maxHeight: '280px', overflowY: 'auto', marginBottom: '20px' }}>
              {filteredReviews.map((rev) => (
                <div
                  key={rev.id}
                  style={{
                    padding: '12px',
                    borderBottom: '1px solid var(--border-color)',
                    marginBottom: '8px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '14px' }}>{rev.author_name}</strong>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--accent-color)' }}>
                      Оценка: {rev.rating} из 5
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                    {rev.comment}
                  </p>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {new Date(rev.created_at).toLocaleDateString('ru-RU')}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Форма добавления отзыва */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <h4 style={{ fontSize: '15px', marginBottom: '10px' }}>Оставить отзыв</h4>

            {user ? (
              <form onSubmit={handleSubmit}>
                {submitSuccess && (
                  <div style={{ padding: '8px', background: 'var(--success-bg)', color: 'var(--success-color)', borderRadius: '6px', fontSize: '13px', marginBottom: '10px' }}>
                    {submitSuccess}
                  </div>
                )}

                <div className="form-group">
                  <label>Оценка услуги:</label>
                  <select
                    className="form-control"
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    style={{ maxWidth: '200px' }}
                  >
                    <option value={5}>5 (Отлично)</option>
                    <option value={4}>4 (Хорошо)</option>
                    <option value={3}>3 (Нормально)</option>
                    <option value={2}>2 (Не понравилось)</option>
                    <option value={1}>1 (Плохо)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Ваш комментарий:</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Ваш отзыв..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    style={{ resize: 'none' }}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={submitting}
                >
                  {submitting ? 'Отправка...' : 'Опубликовать отзыв'}
                </button>
              </form>
            ) : (
              <div style={{
                background: 'rgba(0,0,0,0.03)',
                padding: '14px',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                  Оставлять отзывы могут только авторизованные пользователи.
                </p>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    onClose();
                    onOpenAuth();
                  }}
                >
                  Войти в аккаунт
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-outline" onClick={onClose}>Закрыть</button>
        </div>
      </div>
    </div>
  );
}
