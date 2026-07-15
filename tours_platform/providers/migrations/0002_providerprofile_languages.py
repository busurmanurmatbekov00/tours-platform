from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('providers', '0001_initial'),
        ('core', '0001_initial'),
    ]

    state_operations = [
        migrations.AddField(
            model_name='providerprofile',
            name='languages',
            field=models.ManyToManyField(
                blank=True, related_name='provider_profiles', to='core.language'
            ),
        ),
    ]

    database_operations = [
        migrations.RunSQL(
            sql="""
                CREATE TABLE `provider_profiles_languages` (
                    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
                    `providerprofile_id` bigint unsigned NOT NULL,
                    `language_id` bigint unsigned NOT NULL,
                    PRIMARY KEY (`id`),
                    UNIQUE KEY `pp_lang_uniq` (`providerprofile_id`, `language_id`),
                    KEY `pp_lang_language_idx` (`language_id`),
                    CONSTRAINT `pp_lang_provider_fk` FOREIGN KEY (`providerprofile_id`) REFERENCES `provider_profiles` (`id`) ON DELETE CASCADE,
                    CONSTRAINT `pp_lang_language_fk` FOREIGN KEY (`language_id`) REFERENCES `languages` (`id`) ON DELETE CASCADE
                ) ENGINE=InnoDB;
            """,
            reverse_sql="DROP TABLE IF EXISTS `provider_profiles_languages`;",
        ),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=state_operations,
            database_operations=database_operations,
        ),
    ]