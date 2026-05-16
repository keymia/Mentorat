from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("mentorat", "0005_mentorshipperiod_auto_completed_at"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="MentorshipPeriodExportLog",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("format", models.CharField(choices=[("xlsx", "Excel"), ("csv", "CSV")], max_length=10)),
                ("file_name", models.CharField(max_length=255)),
                ("exported_at", models.DateTimeField(auto_now_add=True)),
                (
                    "exported_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="mentorship_period_exports",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "period",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="export_logs",
                        to="mentorat.mentorshipperiod",
                    ),
                ),
            ],
            options={
                "ordering": ["-exported_at"],
                "indexes": [models.Index(fields=["period", "format", "exported_at"], name="mentorat_me_period__5774f8_idx")],
            },
        ),
    ]
