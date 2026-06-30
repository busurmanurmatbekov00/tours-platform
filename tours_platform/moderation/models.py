from django.db import models


class ModerationAction(models.Model):
    """Журнал действий модерации администратором."""
    ACTION_CHOICES = [
        ('hide_tour', 'Скрыть тур'),
        ('unhide_tour', 'Снять скрытие'),
        ('delete_tour', 'Удалить тур'),
        ('block_provider', 'Заблокировать исполнителя'),
        ('unblock_provider', 'Разблокировать исполнителя'),
        ('approve_verification', 'Одобрить верификацию'),
        ('reject_verification', 'Отклонить верификацию'),
    ]
    id = models.BigAutoField(primary_key=True)
    admin_user = models.ForeignKey(
        'users.User', on_delete=models.SET_NULL,
        blank=True, null=True, related_name='moderation_actions',
        db_column='admin_user_id',
    )
    action_type = models.CharField(max_length=30, choices=ACTION_CHOICES)
    target_tour = models.ForeignKey(
        'tours.Tour', on_delete=models.SET_NULL,
        blank=True, null=True, db_column='target_tour_id',
    )
    target_provider_profile = models.ForeignKey(
        'providers.ProviderProfile', on_delete=models.SET_NULL,
        blank=True, null=True, db_column='target_provider_profile_id',
    )
    reason = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'moderation_actions'
        verbose_name = 'Действие модерации'
        verbose_name_plural = 'Журнал модерации'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.get_action_type_display()} @ {self.created_at:%Y-%m-%d %H:%M}'