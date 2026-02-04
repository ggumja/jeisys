import { useState } from 'react';
import { GripVertical, ChevronDown, ChevronRight, Plus, Edit, Trash2 } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  productCount: number;
  parentId: string | null;
  order: number;
}

interface CategoryManagerProps {
  categories: Category[];
  onUpdate: (categories: Category[]) => void;
}

export function CategoryManager({ categories, onUpdate }: CategoryManagerProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editName, setEditName] = useState('');
  const [addingSubCategoryTo, setAddingSubCategoryTo] = useState<string | null>(null);
  const [newSubCategoryName, setNewSubCategoryName] = useState('');
  const [draggedItem, setDraggedItem] = useState<Category | null>(null);

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCategories(newExpanded);
  };

  const getChildCategories = (parentId: string | null) => {
    return categories
      .filter(cat => cat.parentId === parentId)
      .sort((a, b) => a.order - b.order);
  };

  const handleAddSubCategory = (parentId: string) => {
    if (newSubCategoryName.trim()) {
      const maxOrder = Math.max(
        ...categories.filter(c => c.parentId === parentId).map(c => c.order),
        0
      );
      const newCategory: Category = {
        id: Date.now().toString(),
        name: newSubCategoryName,
        productCount: 0,
        parentId,
        order: maxOrder + 1,
      };
      onUpdate([...categories, newCategory]);
      setNewSubCategoryName('');
      setAddingSubCategoryTo(null);
      setExpandedCategories(new Set([...expandedCategories, parentId]));
    }
  };

  const handleEditCategory = () => {
    if (editingCategory && editName.trim()) {
      const updated = categories.map(cat =>
        cat.id === editingCategory.id ? { ...cat, name: editName } : cat
      );
      onUpdate(updated);
      setEditingCategory(null);
      setEditName('');
    }
  };

  const handleDeleteCategory = (id: string) => {
    const hasChildren = categories.some(cat => cat.parentId === id);
    const category = categories.find(cat => cat.id === id);
    
    if (hasChildren) {
      alert('하위 카테고리가 있는 카테고리는 삭제할 수 없습니다.');
      return;
    }
    
    if (category && category.productCount > 0) {
      alert('해당 카테고리에 상품이 존재하여 삭제할 수 없습니다.');
      return;
    }

    onUpdate(categories.filter(cat => cat.id !== id));
  };

  const handleDragStart = (e: React.DragEvent, category: Category) => {
    setDraggedItem(category);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetCategory: Category) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem.id === targetCategory.id) {
      setDraggedItem(null);
      return;
    }

    // 같은 부모를 가진 경우만 순서 변경 허용
    if (draggedItem.parentId !== targetCategory.parentId) {
      setDraggedItem(null);
      return;
    }

    const siblings = categories.filter(cat => cat.parentId === draggedItem.parentId);
    const draggedIndex = siblings.findIndex(cat => cat.id === draggedItem.id);
    const targetIndex = siblings.findIndex(cat => cat.id === targetCategory.id);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedItem(null);
      return;
    }

    // 순서 재조정
    const newOrder = [...siblings];
    const [removed] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, removed);

    // order 값 업데이트
    const updatedCategories = categories.map(cat => {
      if (cat.parentId === draggedItem.parentId) {
        const newIndex = newOrder.findIndex(c => c.id === cat.id);
        return { ...cat, order: newIndex + 1 };
      }
      return cat;
    });

    onUpdate(updatedCategories);
    setDraggedItem(null);
  };

  const renderCategory = (category: Category, level: number = 0) => {
    const children = getChildCategories(category.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedCategories.has(category.id);
    const isEditing = editingCategory?.id === category.id;
    const isAddingSubCategory = addingSubCategoryTo === category.id;

    return (
      <div key={category.id}>
        <div
          className={`flex items-center gap-2 px-4 py-3 hover:bg-neutral-50 border-b border-neutral-200 ${
            draggedItem?.id === category.id ? 'opacity-50' : ''
          }`}
          style={{ paddingLeft: `${level * 24 + 16}px` }}
          draggable
          onDragStart={(e) => handleDragStart(e, category)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, category)}
        >
          <button
            className="cursor-move p-1 text-neutral-400 hover:text-neutral-600"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-4 h-4" />
          </button>

          {hasChildren ? (
            <button
              onClick={() => toggleExpanded(category.id)}
              className="p-1 text-neutral-600 hover:text-neutral-900"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          ) : (
            <div className="w-6" />
          )}

          <div className="flex-1">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 px-3 py-1 border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleEditCategory();
                    if (e.key === 'Escape') {
                      setEditingCategory(null);
                      setEditName('');
                    }
                  }}
                />
                <button
                  onClick={handleEditCategory}
                  className="px-3 py-1 bg-neutral-900 text-white text-sm hover:bg-neutral-800"
                >
                  완료
                </button>
                <button
                  onClick={() => {
                    setEditingCategory(null);
                    setEditName('');
                  }}
                  className="px-3 py-1 border border-neutral-300 text-sm hover:bg-neutral-50"
                >
                  취소
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-neutral-900">
                  {category.name}
                </span>
                <span className="text-xs text-neutral-500">
                  상품 {category.productCount}개
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setAddingSubCategoryTo(category.id)}
              className="p-2 border border-neutral-300 text-neutral-600 hover:bg-neutral-50 transition-colors"
              title="하위 카테고리 추가"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setEditingCategory(category);
                setEditName(category.name);
              }}
              className="p-2 border border-neutral-300 text-neutral-900 hover:bg-neutral-50 transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDeleteCategory(category.id)}
              className="p-2 border border-neutral-300 text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {isAddingSubCategory && (
          <div
            className="flex items-center gap-2 px-4 py-3 bg-neutral-50 border-b border-neutral-200"
            style={{ paddingLeft: `${(level + 1) * 24 + 16}px` }}
          >
            <div className="w-6" />
            <input
              type="text"
              value={newSubCategoryName}
              onChange={(e) => setNewSubCategoryName(e.target.value)}
              placeholder="하위 카테고리 이름"
              className="flex-1 px-3 py-2 border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddSubCategory(category.id);
                if (e.key === 'Escape') {
                  setAddingSubCategoryTo(null);
                  setNewSubCategoryName('');
                }
              }}
            />
            <button
              onClick={() => handleAddSubCategory(category.id)}
              className="px-4 py-2 bg-neutral-900 text-white text-sm hover:bg-neutral-800"
            >
              추가
            </button>
            <button
              onClick={() => {
                setAddingSubCategoryTo(null);
                setNewSubCategoryName('');
              }}
              className="px-4 py-2 border border-neutral-300 text-sm hover:bg-neutral-50"
            >
              취소
            </button>
          </div>
        )}

        {isExpanded && hasChildren && (
          <div>
            {children.map(child => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const rootCategories = getChildCategories(null);

  return (
    <div className="bg-white border border-neutral-200">
      {rootCategories.length > 0 ? (
        <div>
          {rootCategories.map(category => renderCategory(category))}
        </div>
      ) : (
        <div className="py-16 text-center">
          <p className="text-neutral-600">등록된 카테고리가 없습니다</p>
        </div>
      )}
    </div>
  );
}
