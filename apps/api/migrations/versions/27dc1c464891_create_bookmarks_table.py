"""create bookmarks table"""

from alembic import op
import sqlalchemy as sa

revision = "27dc1c464891"
down_revision = "7b9c2d4e6f10"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "bookmarks",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("site_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["site_id"], ["heritage_sites.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("user_id", "site_id", name="uq_user_site_bookmark"),
    )
    op.create_index("ix_bookmarks_id", "bookmarks", ["id"], unique=False)
    op.create_index("ix_bookmarks_user_id", "bookmarks", ["user_id"], unique=False)
    op.create_index("ix_bookmarks_site_id", "bookmarks", ["site_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_bookmarks_site_id", table_name="bookmarks")
    op.drop_index("ix_bookmarks_user_id", table_name="bookmarks")
    op.drop_index("ix_bookmarks_id", table_name="bookmarks")
    op.drop_table("bookmarks")
