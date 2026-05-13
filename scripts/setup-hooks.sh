# setup-hooks.sh
# ejecutar UNA VEZ después de clonar el repo para activar los git hooks
# uso: sh scripts/setup-hooks.sh


echo "🔧 configurando git hooks..."

# configurar git para usar la carpeta .githooks/ en lugar de .git/hooks/
git config core.hooksPath .githooks

# asegurar que los hooks tengan permisos de ejecución
chmod +x .githooks/*

echo "✅ git hooks activados correctamente"
echo ""
echo "hooks instalados:"
echo "  • post-merge (después de pull): aplica migraciones de prisma automáticamente"
echo "  • pre-push (antes de push): bloquea push si falta crear migración"
echo ""