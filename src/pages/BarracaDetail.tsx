import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AdminBarracaForm from '../components/AdminBarracaForm';

const BarracaDetail: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900" data-lingo-skip>
            {id ? t('admin.editBarraca') : t('admin.addBarraca')}
          </h1>
          <button
            onClick={() => navigate('/barracas')}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {t('common.back') || 'Back'}
          </button>
        </div>

        <AdminBarracaForm
          barracaId={id || null}
          onCancel={() => navigate('/barracas')}
          onSave={() => navigate('/barracas')}
        />
      </div>
    </div>
  );
};

export default BarracaDetail;


