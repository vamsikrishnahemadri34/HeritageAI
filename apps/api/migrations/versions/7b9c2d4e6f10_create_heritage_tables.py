from alembic import op
import sqlalchemy as sa

revision = "7b9c2d4e6f10"
down_revision = "52a13f90913d"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "heritage_sites",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("category", sa.String(100), nullable=False),
        sa.Column("location", sa.String(255), nullable=False),
        sa.Column("state", sa.String(100), nullable=False),
        sa.Column("country", sa.String(100), nullable=False, server_default="India"),
        sa.Column("latitude", sa.Float(), nullable=True),
        sa.Column("longitude", sa.Float(), nullable=True),
        sa.Column("historical_period", sa.String(150), nullable=True),
        sa.Column("image_url", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_heritage_sites_id", "heritage_sites", ["id"])
    op.create_index("ix_heritage_sites_name", "heritage_sites", ["name"])

    op.create_table(
        "heritage_artifacts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("site_id", sa.Integer(), sa.ForeignKey("heritage_sites.id", ondelete="SET NULL"), nullable=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("artifact_type", sa.String(100), nullable=False),
        sa.Column("historical_period", sa.String(150), nullable=True),
        sa.Column("image_url", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_heritage_artifacts_id", "heritage_artifacts", ["id"])

    op.create_table(
        "inscriptions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("site_id", sa.Integer(), sa.ForeignKey("heritage_sites.id", ondelete="SET NULL"), nullable=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("original_text", sa.Text(), nullable=True),
        sa.Column("translated_text", sa.Text(), nullable=True),
        sa.Column("language", sa.String(100), nullable=True),
        sa.Column("historical_period", sa.String(150), nullable=True),
        sa.Column("image_url", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_inscriptions_id", "inscriptions", ["id"])


def downgrade():
    op.drop_index("ix_inscriptions_id", table_name="inscriptions")
    op.drop_table("inscriptions")
    op.drop_index("ix_heritage_artifacts_id", table_name="heritage_artifacts")
    op.drop_table("heritage_artifacts")
    op.drop_index("ix_heritage_sites_name", table_name="heritage_sites")
    op.drop_index("ix_heritage_sites_id", table_name="heritage_sites")
    op.drop_table("heritage_sites")
