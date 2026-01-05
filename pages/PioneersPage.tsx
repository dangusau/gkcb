import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Briefcase, Star, Loader2 } from 'lucide-react';
import { supabase } from '../services/supabase';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';

type Pioneer = {
  id: string;
  name: string;
  position: string;
  bio?: string;
  image_url?: string;
  is_active: boolean;
  order_index: number;
  created_at: string;
  achievements?: string[];
  contact_info?: string;
};

const PioneersPage = () => {
  const navigate = useNavigate();
  const [pioneers, setPioneers] = useState<Pioneer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPioneers();
  }, []);

  const fetchPioneers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Query pioneers from database
      const { data, error } = await supabase
        .from('pioneers')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Error fetching pioneers:', error);
        setError('Failed to load pioneers');
        return;
      }

      setPioneers(data || []);
    } catch (err: any) {
      console.error('Error:', err);
      setError('Failed to load pioneers');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'P';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="min-h-screen bg-gray-50 safe-area pb-20">
      <Header />
      
      <main className="px-4 pt-4 max-w-screen-sm mx-auto">
        {/* Title Only - Back Button Removed */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Pioneers of GKBC</h1>
          <p className="text-gray-600 text-sm">Meet our founding members and leaders</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchPioneers}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : pioneers.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Crown className="w-8 h-8 text-blue-600" />
            </div>
            <h4 className="text-lg font-bold text-gray-900 mb-2">No Pioneers Found</h4>
            <p className="text-gray-600 text-sm">
              Our pioneers list will be available soon.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {pioneers.map((pioneer) => (
              <div key={pioneer.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Pioneer Image */}
                    <div className="flex-shrink-0">
                      <div className="relative">
                        <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-blue-500 shadow-lg bg-gray-100">
                          {pioneer.image_url ? (
                            <img
                              src={pioneer.image_url}
                              alt={pioneer.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.parentElement!.innerHTML = `
                                  <div class="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                                    ${getInitials(pioneer.name)}
                                  </div>
                                `;
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                              {getInitials(pioneer.name)}
                            </div>
                          )}
                        </div>
                        <div className="absolute -top-2 -right-2 w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-lg">
                          <Crown size={18} className="text-white" />
                        </div>
                      </div>
                    </div>

                    {/* Pioneer Info */}
                    <div className="flex-1">
                      <div className="mb-3">
                        <h3 className="text-xl font-bold text-gray-900 mb-1">{pioneer.name}</h3>
                        <div className="flex items-center gap-2 text-blue-600 font-medium mb-2">
                          <Briefcase size={16} />
                          <span>{pioneer.position}</span>
                        </div>
                        {pioneer.bio && (
                          <p className="text-gray-600 leading-relaxed">{pioneer.bio}</p>
                        )}
                      </div>

                      {/* Achievements */}
                      {pioneer.achievements && pioneer.achievements.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <Star size={16} className="text-yellow-500" />
                            Key Achievements
                          </h4>
                          <ul className="space-y-1">
                            {pioneer.achievements.map((achievement, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                                <span className="text-sm text-gray-600">{achievement}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Contact Info */}
                      {pioneer.contact_info && (
                        <div className="mt-4">
                          <h4 className="text-sm font-semibold text-gray-900 mb-2">
                            Contact Information
                          </h4>
                          <p className="text-sm text-gray-600">{pioneer.contact_info}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default PioneersPage;