from django.db import migrations, models


def copy_global_limit_to_periods(apps, schema_editor):
    ParametreSysteme = apps.get_model("parametres", "ParametreSysteme")
    MentorshipPeriod = apps.get_model("mentorat", "MentorshipPeriod")
    value = ParametreSysteme.objects.filter(cle="MAX_MENTORES_PAR_MENTOR").values_list("valeur", flat=True).first()
    try:
        limit = int(value)
    except (TypeError, ValueError):
        limit = 5
    MentorshipPeriod.objects.update(max_mentees_per_mentor=max(limit, 1))


class Migration(migrations.Migration):
    dependencies = [
        ("parametres", "0002_seed_parametres"),
        ("mentorat", "0006_mentorshipperiodexportlog"),
    ]

    operations = [
        migrations.AddField(
            model_name="mentorshipperiod",
            name="max_mentees_per_mentor",
            field=models.PositiveSmallIntegerField(default=5),
        ),
        migrations.RunPython(copy_global_limit_to_periods, migrations.RunPython.noop),
    ]
