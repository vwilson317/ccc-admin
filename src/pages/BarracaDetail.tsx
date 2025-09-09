import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AdminBarracaForm from '../components/AdminBarracaForm';
import ContactInfoAccordion from '../components/ContactInfoAccordion';
import { useApp } from '../contexts/AppContext';
import { Barraca } from '../types';

const BarracaDetail: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { barracas, updateBarraca } = useApp();
  const [currentBarraca, setCurrentBarraca] = useState<Barraca | null>(null);

  useEffect(() => {
    if (id) {
      const barraca = barracas.find(b => b.id === id);
      if (barraca) {
        setCurrentBarraca(barraca);
      }
    }
  }, [id, barracas]);

  const handleContactUpdate = async (updatedContact: Barraca['contact']) => {
    if (!currentBarraca) return;
    
    try {
      const updatedBarraca = { ...currentBarraca, contact: updatedContact };
      await updateBarraca(updatedBarraca);
      setCurrentBarraca(updatedBarraca);
    } catch (error) {
      console.error('Failed to update contact info:', error);
    }
  };

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

        {/* Contact Info Accordion - Only show for existing barracas */}
        {currentBarraca && (
          <div className="mb-6">
            <ContactInfoAccordion 
              barraca={currentBarraca} 
              onContactUpdate={handleContactUpdate}
            />
          </div>
        )}

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


